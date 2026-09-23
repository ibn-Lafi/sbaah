import { ApiError } from './api-error';

interface DatabaseError {
  code?: string;
  message: string;
}

const AVAILABILITY_CONFLICT = /reserved|already been sold|lease contract|conflicts with/i;

/**
 * Commercial writes enforce their business rules inside Postgres (the
 * availability engine, integrity triggers, RLS). Those rejections are the
 * user's to fix, so they map to a 4xx with a readable message instead of an
 * opaque 500; anything else stays an internal error.
 */
export function databaseWriteError(error: DatabaseError, action: string): Error {
  switch (error.code) {
    case '42501':
      return new ApiError(403, 'forbidden', 'ليس لديك صلاحية لتنفيذ هذا الإجراء');
    case '23505':
      return new ApiError(409, 'duplicate_record', 'يوجد سجل مسجل مسبقًا بنفس البيانات');
    case '23503':
    case '23514':
    case 'P0001':
      console.warn(`${action} rejected by a database rule: ${error.message}`);
      return AVAILABILITY_CONFLICT.test(error.message)
        ? new ApiError(409, 'asset_unavailable', 'العقار غير متاح لهذه العملية: محجوز أو مباع أو مؤجر')
        : new ApiError(409, 'business_rule_violation', 'لا يمكن إتمام العملية لتعارضها مع بيانات مسجلة');
    default:
      return new Error(`${action}: ${error.message}`);
  }
}
