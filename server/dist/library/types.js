"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorResponse = void 0;
class ErrorResponse {
    message;
    details;
    constructor(message, details) {
        this.message = message;
        this.details = details;
    }
}
exports.ErrorResponse = ErrorResponse;
