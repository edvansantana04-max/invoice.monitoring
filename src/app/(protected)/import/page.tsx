import { importExcel } from "./actions";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Import dari Excel</h1>
        <p className="text-sm text-slate-600">
          Upload file Excel (format seperti contoh yang Anda lampirkan). Import
          akan menambahkan data baru dan skip jika terdeteksi duplikat sederhana.
        </p>
      </div>

      <form
        action={importExcel}
        className="max-w-2xl space-y-4 rounded-xl border bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">File Excel</label>
          <input
            type="file"
            name="file"
            accept=".xlsx"
            required
            className="block w-full rounded-md border bg-white px-3 py-2 text-sm"
          />
        </div>

        <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Import
        </button>
      </form>
    </div>
  );
}

