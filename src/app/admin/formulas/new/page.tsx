import { OfficialFormulaForm } from "@/components/admin/official-formula-form";
import { requireCurrentAdmin } from "@/server/auth/current-learner";
import { getOfficialFormulaMaintenanceCatalog } from "@/server/services/formula-maintenance-service";

export const dynamic = "force-dynamic";

export default async function NewOfficialFormulaPage() {
  await requireCurrentAdmin();
  const catalog = await getOfficialFormulaMaintenanceCatalog();

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 md:px-6 lg:px-8">
        <header className="border-b pb-5">
          <p className="text-sm font-medium text-muted-foreground">官方公式库</p>
          <h1 className="mt-1 text-2xl font-semibold">新增官方公式</h1>
        </header>
        <OfficialFormulaForm
          mode="create"
          relationOptions={catalog.items.map((item) => ({
            slug: item.slug,
            title: item.title,
          }))}
        />
      </div>
    </main>
  );
}
