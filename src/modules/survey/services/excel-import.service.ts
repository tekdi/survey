import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ExcelJS from 'exceljs';
import { SurveyContextType, SurveyStatus } from '../entities/survey.entity';
import { FieldType } from '../entities/survey-field.entity';

export interface ExcelValidationError {
  sheet: string;
  row?: number;
  field?: string;
  message: string;
}

export interface ParsedSurveyInfo {
  surveyTitle: string;
  tenantId: string;
  targetRoles: string[] | null;
  targetGeo: { label: string } | null;
  contextType: SurveyContextType;
  surveyType: string | null;
  academicYear?: string[] | null;
  startDate?: Date;
  endDate?: Date;
}

export interface ParsedSurveyField {
  fieldName: string;
  fieldLabel: string;
  fieldType: FieldType;
  isRequired: boolean;
  displayOrder: number;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  validations: Record<string, any>;
  dataSource?: Record<string, any>;
  uploadConfig?: Record<string, any>;
  uiConfig: Record<string, any>;
  conditionalLogic?: Record<string, any>;
}

@Injectable()
export class ExcelImportService {
  constructor(private readonly configService: ConfigService) { }

  private normalizeHeader(value: string): string {
    return (value || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/\*/g, '')
      .replace(/[→→]/g, '->')
      .replace(/–/g, '-')
      .trim();
  }

  private getCellValue(cell: ExcelJS.Cell): string {
    if (!cell || cell.value === null || cell.value === undefined) {
      return '';
    }
    if (cell.value instanceof Date) {
      return cell.value.toISOString();
    }
    if (typeof cell.value === 'object') {
      if ('result' in cell.value && cell.value.result !== undefined && cell.value.result !== null) {
        return cell.value.result.toString().trim();
      }
      if ('text' in cell.value && cell.value.text !== undefined && cell.value.text !== null) {
        return cell.value.text.toString().trim();
      }
      if ('richText' in cell.value && Array.isArray((cell.value as any).richText)) {
        return (cell.value as any).richText.map((t: any) => t.text || '').join('').trim();
      }
    }
    return cell.value.toString().trim();
  }

  private isTemplateHintText(value: string): boolean {
    const v = (value || '').trim().toLowerCase();
    if (!v) return false;
    // Common template/helper phrases present in the sample sheet that should not be treated as input.
    return (
      v.includes('example:') ||
      v.includes('program or tenant') ||
      v.includes('could be') ||
      v.includes('should be') ||
      v.includes('date from which') ||
      v.includes('last date') ||
      v.includes('must map to one of')
    );
  }

  private parseDateFlexible(value: string): Date | undefined {
    const raw = (value || '').trim();
    if (!raw) return undefined;

    // ISO / RFC / yyyy-mm-dd etc.
    const direct = new Date(raw);
    if (!isNaN(direct.getTime())) return direct;

    // dd/mm/yyyy or dd-mm-yyyy (common in India templates)
    const m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (m) {
      const dd = Number(m[1]);
      const mm = Number(m[2]);
      const yyyy = Number(m[3]);
      const d = new Date(Date.UTC(yyyy, mm - 1, dd));
      // validate rollover (e.g. 32/01/2026)
      if (
        d.getUTCFullYear() === yyyy &&
        d.getUTCMonth() === mm - 1 &&
        d.getUTCDate() === dd
      ) {
        return d;
      }
    }

    return undefined;
  }

  private resolveTenantIdFromMap(tenantName: string, tenantMap: Record<string, string>): string {
    const name = (tenantName || '').trim();
    if (!name) return '';

    // Support both shapes:
    // 1) { "pratham": "<uuid>" } (name -> id)
    // 2) { "<uuid>": "Pratham" } (id -> name)
    const lowerRaw = name.toLowerCase();
    // Small alias normalization for common variations in templates/user input.
    const lower =
      lowerRaw === 'second chance'
        ? 'second chance program'
        : lowerRaw;

    // Shape (1): direct lookup by key
    const direct = tenantMap[lower];
    if (direct) return direct;

    // Shape (2): reverse lookup by value (case-insensitive)
    const foundEntry = Object.entries(tenantMap).find(
      ([, v]) => (v || '').toString().trim().toLowerCase() === lower,
    );
    return foundEntry ? foundEntry[0] : '';
  }

  private findOptionColumns(headers: string[]): number[] {
    const optionCols: { order: number; col: number }[] = [];

    headers.forEach((h, col) => {
      if (!h || col === 0) return;
      const match = h.match(/option\s*r(\d+)/);
      if (match) {
        optionCols.push({ order: parseInt(match[1], 10), col });
      }
    });

    return optionCols.sort((a, b) => a.order - b.order).map((o) => o.col);
  }

  private isLegendOrInstructionRow(values: {
    fieldName: string;
    fieldLabel: string;
    fieldTypeRaw: string;
    validationVal: string;
    minStr: string;
    maxStr: string;
  }): boolean {
    const joined = [
      values.fieldName,
      values.fieldLabel,
      values.fieldTypeRaw,
      values.validationVal,
      values.minStr,
      values.maxStr,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // The provided sample sheet contains legend/instruction rows like:
    // "LEGEND — Question Types", "Single-line text input...", etc.
    if (
      joined.includes('legend') ||
      joined.includes('question types') ||
      joined.includes('single-line text input') ||
      joined.includes('multi-line text area') ||
      joined.includes('numeric input') ||
      joined.includes('date picker') ||
      joined.includes('time picker') ||
      joined.includes('single choice from options') ||
      joined.includes('multi-select from options') ||
      joined.includes('same as radio') ||
      joined.includes('rendered as a dropdown') ||
      joined.includes('star / emoji rating') ||
      joined.includes('slider or numeric scale') ||
      joined.includes('attach a file')
    ) {
      return true;
    }

    // A real Question ID should not look like prose.
    const id = (values.fieldName || '').trim();
    if (id && (id.includes(' ') || id.length > 80)) return true;

    // If there's no Question ID/type/label and remaining cells look like prose,
    // treat as instruction/helper row (common in templates).
    const hasCore =
      (values.fieldName || '').trim() ||
      (values.fieldLabel || '').trim() ||
      (values.fieldTypeRaw || '').trim();
    if (!hasCore && this.isTemplateHintText(joined)) {
      return true;
    }

    return false;
  }

  public async parseAndValidate(
    fileBuffer: any,
    headerTenantId?: string,
  ): Promise<{
    info: ParsedSurveyInfo;
    fields: ParsedSurveyField[];
  }> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(fileBuffer);
    } catch (e) {
      throw new BadRequestException('Invalid Excel file format. Only .xlsx files are supported.');
    }

    const infoSheet = workbook.getWorksheet('SurveyInfo');
    // Support both names (older/newer templates)
    const questionsSheet =
      workbook.getWorksheet('Survey Questions');

    const errors: ExcelValidationError[] = [];

    if (!infoSheet || !questionsSheet) {
      errors.push({
        sheet: 'Workbook',
        message: 'Both SurveyInfo and Survey Questions sheets must exist in the workbook.',
      });
      throw new BadRequestException({ errors });
    }

    // 1. Parse SurveyInfo sheet
    const normalizeInfoKey = (k: string) => (k || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const surveyInfoEntries: Array<{
      row: number;
      key: string;
      value: string;
      normalizedKey: string;
      valueFromInputs: string;
      valueFromSecondCol: string;
    }> = [];

    let anyInputsValuePresent = false;
    infoSheet.eachRow((row) => {
      const key = this.getCellValue(row.getCell(1)).trim();
      // Newer templates: A = Field, B = Description/Guidance, C = Inputs (actual value)
      // Older templates: A = Field, B = Value
      const valueFromInputs = this.getCellValue(row.getCell(3)).trim();
      const valueFromSecondCol = this.getCellValue(row.getCell(2)).trim();
      if (!key) return;
      const normalizedKey = normalizeInfoKey(key);
      if (!normalizedKey) return;
      if (valueFromInputs) anyInputsValuePresent = true;
      // value is resolved after we know which template we're dealing with.
      surveyInfoEntries.push({
        row: row.number,
        key,
        value: '',
        normalizedKey,
        valueFromInputs,
        valueFromSecondCol,
      });
    });

    // If the sheet is the newer template (has Inputs column values), never treat Guidance (col B)
    // as an actual value. Missing inputs should be treated as missing (required validation).
    const usesInputsColumn = anyInputsValuePresent;
    for (const entry of surveyInfoEntries) {
      entry.value = usesInputsColumn ? entry.valueFromInputs : entry.valueFromSecondCol;
    }

    // Strict key lookup: column name must follow conventions (no fuzzy matching).
    const getInfoValue = (searchKey: string): string => {
      const normalizedSearch = normalizeInfoKey(searchKey);
      if (!normalizedSearch) return '';

      const candidates = surveyInfoEntries.filter((e) => e.normalizedKey === normalizedSearch);
      const pickBest = (list: typeof candidates) => {
        if (list.length === 0) return '';
        // Prefer non-template values when duplicate keys exist.
        const nonTemplate = list.find((e) => !this.isTemplateHintText(e.value));
        return (nonTemplate || list[0]).value || '';
      };

      // 1) Exact normalized match (preferred)
      const exact = pickBest(candidates);
      if (exact) return exact;
      return '';
    };

    // Validate required SurveyInfo keys exist exactly as per template conventions.
    // Some keys in the template include guidance in parentheses (must match as-is).
    const requiredSurveyInfoKeys: Array<{ field: string; acceptedKeys: string[] }> = [
      { field: 'SurveyName', acceptedKeys: ['SurveyName'] },
      { field: 'Tenant name', acceptedKeys: ['Tenant name', 'TenantName'] },
      { field: 'Context', acceptedKeys: ['Context', 'Context (Subject of the survey)'] },
    ];
    const normalizedAvailableInfoKeys = new Set(surveyInfoEntries.map((e) => e.normalizedKey));
    for (const req of requiredSurveyInfoKeys) {
      const ok = req.acceptedKeys.some((k) => normalizedAvailableInfoKeys.has(normalizeInfoKey(k)));
      if (!ok) {
        errors.push({
          sheet: 'SurveyInfo',
          field: req.field,
          message: `Missing required row. Use exactly one of: ${req.acceptedKeys
            .map((k) => `'${k}'`)
            .join(', ')}. Column name must be same as per conventions.`,
        });
      }
    }

    // Validations & Parsing for SurveyInfo
    const surveyName = getInfoValue('SurveyName');
    if (!surveyName) {
      errors.push({ sheet: 'SurveyInfo', field: 'SurveyName', message: 'SurveyName is required' });
    } else if (surveyName.length > 255) {
      errors.push({
        sheet: 'SurveyInfo',
        field: 'SurveyName',
        message: 'SurveyName must not exceed 255 characters',
      });
    }

    const tenantName = getInfoValue('TenantName') || getInfoValue('Tenant name');
    let resolvedTenantId = '';
    if (!tenantName) {
      errors.push({ sheet: 'SurveyInfo', field: 'Tenant name', message: 'Tenant name is required' });
    } else if (this.isTemplateHintText(tenantName)) {
      errors.push({
        sheet: 'SurveyInfo',
        field: 'Tenant name',
        message: `Tenant name looks like template text. Please replace it with an actual tenant (e.g. SecondChance).`,
      });
    } else {
      const tenantMap = this.configService.get<Record<string, string>>('app.tenantMap') || {};
      resolvedTenantId = this.resolveTenantIdFromMap(tenantName, tenantMap);
      if (!resolvedTenantId) {
        errors.push({
          sheet: 'SurveyInfo',
          field: 'Tenant name',
          message: `Tenant name '${tenantName}' could not be resolved to a known tenant ID`,
        });
      } else if (headerTenantId && resolvedTenantId.toLowerCase() !== headerTenantId.toLowerCase()) {
        errors.push({
          sheet: 'SurveyInfo',
          field: 'Tenant name',
          message: `Tenant name '${tenantName}' (resolved to '${resolvedTenantId}') does not match the active tenant ID from headers '${headerTenantId}'`,
        });
      }
    }

    const targetRoleStr =
      getInfoValue('TargetRole') ||
      getInfoValue('TargetRole (who fills)') ||
      getInfoValue('Target Role (who fills)');
    const targetRoles = targetRoleStr
      ? targetRoleStr
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean)
      : null;

    const targetGeoValue = getInfoValue('TargetGeo');
    const targetGeo = targetGeoValue ? { label: targetGeoValue } : null;

    const contextRaw = (getInfoValue('Context') || getInfoValue('Context (Subject of the survey)')).trim();
    const allowedContexts = ['learner', 'center', 'teacher', 'self', 'none'];
    const contextParts = contextRaw
      ? contextRaw
          .split(',')
          .map((c) => c.trim().toLowerCase())
          .filter(Boolean)
      : [];

    const invalidContexts = contextParts.filter((c) => !allowedContexts.includes(c));
    if (invalidContexts.length > 0) {
      errors.push({
        sheet: 'SurveyInfo',
        field: 'Context',
        message: `Context must map to one of: learner, center, teacher, self, none`,
      });
    }

    // DB column is a single varchar; if multiple are provided, keep the first.
    const contextType: SurveyContextType = ((contextParts[0] || SurveyContextType.NONE) as SurveyContextType);

    const surveyTypeStr = getInfoValue('TypeOfSurvey') || getInfoValue('Type of Survey');
    const surveyType = surveyTypeStr ? surveyTypeStr.trim() : null;

    const academicYearRaw = getInfoValue('Academic Year') || getInfoValue('AcademicYear');
    const academicYear = academicYearRaw
      ? academicYearRaw.split(',').map(y => y.trim()).filter(Boolean) : null;

    const startDateStr = getInfoValue('SurveyRolloutStartDate');
    const endDateStr = getInfoValue('SurveyRolloutEndDate');
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDateStr) {
      if (this.isTemplateHintText(startDateStr)) {
        errors.push({
          sheet: 'SurveyInfo',
          field: 'SurveyRolloutStartDate',
          message: `SurveyRolloutStartDate looks like template text. Please enter a real date (e.g. 28/05/2026).`,
        });
      } else {
        const parsedDate = this.parseDateFlexible(startDateStr);
        if (!parsedDate) {
          errors.push({
            sheet: 'SurveyInfo',
            field: 'SurveyRolloutStartDate',
            message: `Invalid date format: '${startDateStr}'. Supported: ISO or DD/MM/YYYY`,
          });
        } else {
          startDate = parsedDate;
          if (startDate < today) {
            errors.push({
              sheet: 'SurveyInfo',
              field: 'SurveyRolloutStartDate',
              message: 'SurveyRolloutStartDate must not be in the past',
            });
          }
        }
      }
    }

    if (endDateStr) {
      if (this.isTemplateHintText(endDateStr)) {
        errors.push({
          sheet: 'SurveyInfo',
          field: 'SurveyRolloutEndDate',
          message: `SurveyRolloutEndDate looks like template text. Please enter a real date (e.g. 30/06/2026).`,
        });
      } else {
        const parsedDate = this.parseDateFlexible(endDateStr);
        if (!parsedDate) {
          errors.push({
            sheet: 'SurveyInfo',
            field: 'SurveyRolloutEndDate',
            message: `Invalid date format: '${endDateStr}'. Supported: ISO or DD/MM/YYYY`,
          });
        } else {
          endDate = parsedDate;
          if (endDate < today) {
            errors.push({
              sheet: 'SurveyInfo',
              field: 'SurveyRolloutEndDate',
              message: 'SurveyRolloutEndDate must not be in the past',
            });
          }
        }
      }
    }

    if (startDate && endDate && endDate <= startDate) {
      errors.push({
        sheet: 'SurveyInfo',
        field: 'SurveyRolloutEndDate',
        message: 'SurveyRolloutEndDate must be after SurveyRolloutStartDate',
      });
    }

    // 2. Parse Survey Questions sheet
    let headerRowIndex = -1;
    const headers: string[] = [];

    for (let r = 1; r <= questionsSheet.rowCount; r++) {
      const row = questionsSheet.getRow(r);
      const firstVal = this.getCellValue(row.getCell(1)).toLowerCase().trim();
      if (firstVal.includes('question id') || firstVal.includes('question_id')) {
        headerRowIndex = r;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          headers[colNumber] = this.getCellValue(cell)
            .toLowerCase()
            .trim()
            .replace(/\*/g, '')
            .trim();
        });
        break;
      }
    }

    if (headerRowIndex === -1) {
      errors.push({
        sheet: 'Survey Questions',
        message: 'Could not find header row with column "Question ID"',
      });
      throw new BadRequestException({ errors });
    }

    // Strict header validation against template conventions (edit-0.md)
    const expectedHeaders = [
      'Question ID *',
      'Question *',
      'Question Type *',
      'Required?',
      'Validation',
      'Min Value',
      'Max Value',
      'Option R1',
      'Option R2',
      'Option R3',
      'Allow "Other" + Text Box?',
      'File Required',
      'File Formats',
      'Helper Text',
      'Show when Question ID →',
      'Show when Answer equals →',
      'AND: Question ID →',
      'AND: Answer equals →',
    ];
    const normalizedActualHeaders = headers.map((h) => this.normalizeHeader(h || ''));
    const headerSet = new Set(normalizedActualHeaders.filter(Boolean));
    for (const expected of expectedHeaders) {
      const ne = this.normalizeHeader(expected);
      if (!headerSet.has(ne)) {
        errors.push({
          sheet: 'Survey Questions',
          field: expected,
          message: `Missing required column '${expected}'. Column name must be same as per conventions.`,
        });
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({ errors });
    }

    const findCol = (substrings: string[], defaultCol: number): number => {
      const idx = headers.findIndex((h) => h && substrings.some((sub) => h.includes(sub)));
      return idx !== -1 ? idx : defaultCol;
    };

    const fieldNameCol = findCol(['question id'], 1);
    // Label/text column must not accidentally match "question id"
    const fieldLabelCol = (() => {
      const idx = headers.findIndex((h) => {
        if (!h) return false;
        const header = h.trim();
        if (header.includes('question id') || header.includes('question_id')) return false;
        return (
          header === 'question' ||
          header.includes('question label') ||
          header.includes('question text')
        );
      });
      const col = idx !== -1 ? idx : 2;
      return col === fieldNameCol ? 2 : col;
    })();
    const fieldTypeCol = findCol(['question type'], 3);
    const isRequiredCol = findCol(['required'], 4);
    const validationCol = findCol(['validation'], 5);
    const minValCol = findCol(['min value'], 6);
    const maxValCol = findCol(['max value'], 7);
    const optionCols = this.findOptionColumns(headers);
    const allowOtherCol = findCol(['allow "other"', 'allow other'], 11);
    const fileReqCol = findCol(['file required'], 12);
    const fileFormatsCol = findCol(['file formats'], 13);
    const helpTextCol = findCol(['helper text'], 14);
    const condQ1Col = findCol(['show when question id'], 15);
    const condA1Col = findCol(['show when answer equals'], 16);
    const condQ2Col = findCol(['and: question id', 'and question id'], 17);
    const condA2Col = findCol(['and: answer equals', 'and answer equals'], 18);

    const questionIds = new Set<string>();
    const previousQuestionIds = new Set<string>();
    const questionRows: { rowNum: number; row: ExcelJS.Row }[] = [];

    // Collect and index question rows first
    for (let r = headerRowIndex + 1; r <= questionsSheet.rowCount; r++) {
      const row = questionsSheet.getRow(r);
      let isRowEmpty = true;
      row.eachCell((cell) => {
        if (cell && cell.value !== null && cell.value !== undefined && cell.value !== '') {
          isRowEmpty = false;
        }
      });
      if (isRowEmpty) continue;

      const fieldName = this.getCellValue(row.getCell(fieldNameCol)).trim();
      const fieldLabel = this.getCellValue(row.getCell(fieldLabelCol)).trim();
      const fieldTypeRaw = this.getCellValue(row.getCell(fieldTypeCol)).trim();

      if (!fieldName && !fieldLabel && !fieldTypeRaw) {
        continue;
      }

      questionRows.push({ rowNum: r, row });
      if (fieldName) {
        questionIds.add(fieldName);
      }
    }

    if (questionRows.length === 0) {
      errors.push({
        sheet: 'Survey Questions',
        message: 'At least 1 question row must be present',
      });
    }

    const parsedFields: ParsedSurveyField[] = [];

    // Validate each row
    for (let i = 0; i < questionRows.length; i++) {
      const { rowNum: r, row } = questionRows[i];
      const fieldName = this.getCellValue(row.getCell(fieldNameCol)).trim();
      const fieldLabel = this.getCellValue(row.getCell(fieldLabelCol)).trim();
      const fieldTypeRaw = this.getCellValue(row.getCell(fieldTypeCol)).trim();
      const isRequiredRaw = this.getCellValue(row.getCell(isRequiredCol)).trim().toLowerCase();
      const validationVal = this.getCellValue(row.getCell(validationCol)).trim().toLowerCase();
      const minStr = this.getCellValue(row.getCell(minValCol)).trim();
      const maxStr = this.getCellValue(row.getCell(maxValCol)).trim();
      const options = optionCols
        .map((col) => this.getCellValue(row.getCell(col)).trim())
        .filter(Boolean);
      const allowOtherRaw = this.getCellValue(row.getCell(allowOtherCol)).trim().toLowerCase();
      const fileReqRaw = this.getCellValue(row.getCell(fileReqCol)).trim().toLowerCase();
      const fileFormatsRaw = this.getCellValue(row.getCell(fileFormatsCol)).trim();
      const helperText = this.getCellValue(row.getCell(helpTextCol)).trim();
      const condQ1 = this.getCellValue(row.getCell(condQ1Col)).trim();
      const condA1 = this.getCellValue(row.getCell(condA1Col)).trim();
      const condQ2 = this.getCellValue(row.getCell(condQ2Col)).trim();
      const condA2 = this.getCellValue(row.getCell(condA2Col)).trim();

      // Skip template legend/instruction rows (they appear in the sample sheet)
      if (
        this.isLegendOrInstructionRow({
          fieldName,
          fieldLabel,
          fieldTypeRaw,
          validationVal,
          minStr,
          maxStr,
        })
      ) {
        continue;
      }

      // FieldName validation
      if (!fieldName) {
        errors.push({
          sheet: 'Survey Questions',
          row: r,
          field: 'Question ID',
          message: 'Question ID is required',
        });
      } else {
        const occurrences = parsedFields.filter((f) => f.fieldName === fieldName).length;
        if (occurrences > 0) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'Question ID',
            message: `Duplicate Question ID: '${fieldName}'`,
          });
        }
      }

      // FieldLabel validation
      if (!fieldLabel) {
        errors.push({
          sheet: 'Survey Questions',
          row: r,
          field: 'Question',
          message: 'Question label is required',
        });
      } else if (fieldLabel.length > 255) {
        errors.push({
          sheet: 'Survey Questions',
          row: r,
          field: 'Question',
          message: 'Question label must not exceed 255 characters',
        });
      }

      // FieldType validation & mapping
      const allowedExcelTypes = [
        'text',
        'long text',
        'number',
        'date',
        'time',
        'radio',
        'dropdown',
        'checkbox',
        'rating',
        'scale',
        'file upload',
      ];
      const typeLower = fieldTypeRaw.toLowerCase();
      let matchedType: string | undefined;

      for (const t of allowedExcelTypes) {
        if (typeLower.includes(t) || t.includes(typeLower)) {
          matchedType = t;
          break;
        }
      }

      if (!fieldTypeRaw) {
        errors.push({
          sheet: 'Survey Questions',
          row: r,
          field: 'Question Type',
          message: 'Question Type is required',
        });
      } else if (!matchedType) {
        errors.push({
          sheet: 'Survey Questions',
          row: r,
          field: 'Question Type',
          message: `Invalid question type: '${fieldTypeRaw}'`,
        });
      }

      const isRequired = isRequiredRaw === 'yes';

      // Validation Column check
      if (validationVal && validationVal !== 'none' && !['email', 'phone', 'url'].includes(validationVal)) {
        errors.push({
          sheet: 'Survey Questions',
          row: r,
          field: 'Validation',
          message: `Invalid validation format: '${validationVal}'. Accepted values: email, phone, url, none`,
        });
      }

      // Min/Max values
      let min: number | undefined;
      let max: number | undefined;

      if (minStr) {
        min = Number(minStr);
        if (isNaN(min)) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'Min Value',
            message: `Min Value must be a valid number: '${minStr}'`,
          });
          min = undefined;
        }
      }

      if (maxStr) {
        max = Number(maxStr);
        if (isNaN(max)) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'Max Value',
            message: `Max Value must be a valid number: '${maxStr}'`,
          });
          max = undefined;
        }
      }

      if (matchedType === 'rating' || matchedType === 'scale') {
        if (min === undefined || max === undefined) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'Min/Max Value',
            message: `Both Min Value and Max Value are required for Rating and Scale`,
          });
        } else if (min >= max) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'Min/Max Value',
            message: 'Min Value must be strictly less than Max Value',
          });
        }
      } else if (matchedType === 'number') {
        if (min !== undefined && max !== undefined && min > max) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'Min/Max Value',
            message: 'Min Value must be less than or equal to Max Value',
          });
        }
      }

      // Option validation
      if (['radio', 'dropdown', 'checkbox'].includes(matchedType || '')) {
        if (options.length === 0) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'Option R1',
            message: `At least Option R1 is required for Radio, Dropdown, and Checkbox`,
          });
        }
      }

      // Allow "Other"
      const allowOther = allowOtherRaw === 'yes';

      // File upload configs
      const fileRequired = fileReqRaw === 'yes';
      const allowedFormats = fileFormatsRaw
        ? fileFormatsRaw
          .split(',')
          .map((f) => f.trim().toLowerCase())
          .filter(Boolean)
        : [];

      // Helper Text
      if (helperText.length > 500) {
        errors.push({
          sheet: 'Survey Questions',
          row: r,
          field: 'Helper Text',
          message: 'Helper Text must not exceed 500 characters',
        });
      }

      // Conditional Logic
      const conditions: any[] = [];
      if (condQ1) {
        if (!previousQuestionIds.has(condQ1)) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'Show when Question ID',
            message: `Referenced Question ID '${condQ1}' does not exist or appears after this question`,
          });
        }
        if (!condA1) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'Show when Answer equals',
            message: 'Answer is required when Show when Question ID is filled',
          });
        }
        conditions.push({ questionId: condQ1, answer: condA1 });
      }

      if (condQ2) {
        if (!previousQuestionIds.has(condQ2)) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'AND: Question ID',
            message: `Referenced Question ID '${condQ2}' does not exist or appears after this question`,
          });
        }
        if (!condA2) {
          errors.push({
            sheet: 'Survey Questions',
            row: r,
            field: 'AND: Answer equals',
            message: 'Answer is required when AND: Question ID is filled',
          });
        }
        conditions.push({ questionId: condQ2, answer: condA2 });
      }

      // Map excel type to fieldType enum
      const fieldType = this.mapExcelTypeToFieldType(fieldTypeRaw, validationVal);

      // Builders
      const validations: Record<string, any> = {};
      if (fieldType === FieldType.TEXT && validationVal === 'url') {
        validations.format = 'url';
      }
      if (fieldType === FieldType.EMAIL) {
        validations.format = 'email';
      }
      if (fieldType === FieldType.PHONE) {
        validations.format = 'phone';
      }
      if (min !== undefined) {
        validations.min = min;
      }
      if (max !== undefined) {
        validations.max = max;
      }

      const dataSource = ['radio', 'select', 'checkbox'].includes(fieldType)
        ? { options, allowOther }
        : undefined;

      const uploadConfig =
        fieldType === FieldType.FILE_UPLOAD
          ? { required: fileRequired, allowedFormats }
          : undefined;

      const conditionalLogic = conditions.length > 0 ? { conditions } : undefined;

      const parsedField: ParsedSurveyField = {
        fieldName,
        fieldLabel,
        fieldType,
        isRequired,
        displayOrder: i,
        placeholder: undefined,
        helpText: helperText || undefined,
        defaultValue: undefined,
        validations,
        dataSource,
        uploadConfig,
        uiConfig: {},
        conditionalLogic,
      };

      parsedFields.push(parsedField);

      if (fieldName) {
        previousQuestionIds.add(fieldName);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({ errors });
    }

    return {
      info: {
        surveyTitle: surveyName,
        tenantId: resolvedTenantId,
        targetRoles,
        targetGeo,
        contextType,
        surveyType,
        academicYear: academicYear || null,
        startDate,
        endDate,
      },
      fields: parsedFields,
    };
  }

  private mapExcelTypeToFieldType(excelType: string, validation: string): FieldType {
    const typeLower = excelType.toLowerCase().trim();
    const validationLower = validation.toLowerCase().trim();

    if (typeLower.includes('long text') || typeLower === 'textarea') {
      return FieldType.TEXTAREA;
    }
    if (typeLower === 'number') {
      return FieldType.NUMBER;
    }
    if (typeLower === 'date') {
      return FieldType.DATE;
    }
    if (typeLower === 'time') {
      return FieldType.TIME;
    }
    if (typeLower === 'radio') {
      return FieldType.RADIO;
    }
    if (typeLower === 'dropdown' || typeLower === 'select') {
      return FieldType.SELECT;
    }
    if (typeLower === 'checkbox') {
      return FieldType.CHECKBOX;
    }
    if (typeLower === 'rating') {
      return FieldType.RATING;
    }
    if (typeLower === 'scale') {
      return FieldType.SCALE;
    }
    if (typeLower.includes('file upload') || typeLower === 'file_upload') {
      return FieldType.FILE_UPLOAD;
    }
    if (typeLower === 'text' || typeLower.includes('short text')) {
      if (validationLower === 'email') {
        return FieldType.EMAIL;
      }
      if (validationLower === 'phone') {
        return FieldType.PHONE;
      }
      return FieldType.TEXT;
    }

    return FieldType.TEXT;
  }
}
