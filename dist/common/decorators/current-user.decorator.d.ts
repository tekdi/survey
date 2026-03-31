export interface CurrentUserPayload {
    userId: string;
    name: string;
    username: string;
}
export declare const CurrentUser: (...dataOrPipes: (keyof CurrentUserPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
export declare const GetUserId: (...dataOrPipes: unknown[]) => ParameterDecorator;
