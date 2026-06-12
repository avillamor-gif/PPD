import { PolicyForm } from '@/app/components/PolicyForm';

export const metadata = {
  title: 'Submit Policy — Admin Panel',
  description: 'Add a new policy to the Plastic Policy Database',
};

export default function AdminSubmitPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-bold text-ink">Submit New Policy</h1>
        <p className="mt-2 text-ink/60">Add a new policy entry to the database. All fields marked with * are required.</p>
      </div>

      {/* Form */}
      <PolicyForm />

      {/* Info Box */}
      <div className="rounded-2xl border border-ocean/20 bg-ocean/5 p-8">
        <h3 className="font-display text-lg font-bold text-ink mb-3">Integration Ready</h3>
        <p className="text-sm text-ink/70 mb-3">
          This form is designed to work seamlessly with Supabase. Once connected:
        </p>
        <ul className="text-sm text-ink/70 space-y-2">
          <li>✓ Data will be stored in the <code className="bg-paper px-2 py-1 rounded">policies</code> table</li>
          <li>✓ Real-time updates across all pages</li>
          <li>✓ Full-text search integration</li>
          <li>✓ Automatic schema validation</li>
        </ul>
      </div>
    </div>
  );
}
