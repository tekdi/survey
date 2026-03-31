"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIResponse = void 0;
const uuid_1 = require("uuid");
class APIResponse {
    static success(response, apiId, result, statusCode, successMessage) {
        try {
            const params = {
                resmsgid: (0, uuid_1.v4)(),
                status: 'successful',
                err: null,
                errmsg: null,
                successmessage: successMessage,
            };
            const resObj = {
                id: apiId,
                ver: '1.0',
                ts: new Date().toISOString(),
                params,
                responseCode: statusCode,
                ...result,
            };
            return response.status(statusCode).json(resObj);
        }
        catch (e) {
            return e;
        }
    }
    static error(response, apiId, errmsg, error, statusCode) {
        try {
            const params = {
                resmsgid: (0, uuid_1.v4)(),
                status: 'failed',
                err: error,
                errmsg: errmsg,
            };
            const resObj = {
                id: apiId,
                ver: '1.0',
                ts: new Date().toISOString(),
                params,
                responseCode: statusCode,
                result: {},
            };
            return response.status(statusCode).json(resObj);
        }
        catch (e) {
            return e;
        }
    }
}
exports.APIResponse = APIResponse;
//# sourceMappingURL=api-response.js.map