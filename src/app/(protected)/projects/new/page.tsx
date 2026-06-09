import { createProject } from "../actions";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tambah Project</h1>
        <p className="text-sm text-slate-600">
          Client akan otomatis dibuat jika belum ada.
        </p>
      </div>

      <form
        action={createProject}
        className="max-w-2xl space-y-4 rounded-xl border bg-white p-6"
      >
        <Field label="Client" name="clientName" placeholder="Contoh: BTN" />
        <Field label="Project" name="projectName" placeholder="Nama project" />
        <Field label="Produk" name="product" placeholder="Opsional" />
        <Field label="No. PO" name="poNumber" placeholder="Opsional" />
        <Field
          label="Amount Total"
          name="amountTotal"
          placeholder="Contoh: 997500000"
        />

        <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
          Simpan
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  );
}

