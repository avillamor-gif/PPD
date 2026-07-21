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
    </div>
  );
}
