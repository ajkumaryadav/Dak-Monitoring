import { LocalStorageProvider } from "./local-storage-provider";

/**
 * Native storage provider adapter.
 */
export class SupabaseStorageProvider extends LocalStorageProvider {
  override readonly kind = "local";
}
