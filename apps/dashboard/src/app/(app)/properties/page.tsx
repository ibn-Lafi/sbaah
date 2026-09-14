'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  Building,
  BuildingInput,
  Project,
  ProjectInput,
  Property,
  PropertyInput,
  PropertyStatus,
  Rental,
  RentalInput,
  RentalStatus,
} from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { KindTabs, type PropertyKind } from '@/components/properties/kind-tabs';
import { PropertyForm } from '@/components/properties/property-form';
import { BuildingForm } from '@/components/hierarchy/building-form';
import { ProjectForm } from '@/components/hierarchy/project-form';
import { RentalForm } from '@/components/rentals/rental-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import type { UserRole } from '@sbaah/shared';
import { listProperties, createProperty } from '@/lib/api/properties';
import { listBuildings, listProjects, createBuilding, createProject } from '@/lib/api/hierarchy';
import { listRentals, createRental } from '@/lib/api/rentals';
import {
  LISTING_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
} from '@/lib/property/labels';
import { RENTAL_STATUS_LABELS } from '@/lib/rental/labels';
import { formatDate } from '@/lib/format/date';

const KIND_TITLES: Record<PropertyKind, string> = {
  units: 'العقارات',
  buildings: 'العمارات',
  projects: 'المشاريع',
  rentals: 'الإيجارات',
};

function UnitsPanel({
  accessToken,
  role,
  canManage,
}: {
  accessToken: string;
  role: UserRole;
  canManage: boolean;
}) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listProperties(accessToken, statusFilter ? { status: statusFilter } : {}).then(
      (result) => {
        if (!cancelled) setProperties(result.properties);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [accessToken, statusFilter]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PropertyStatus | '')}
          className="w-[200px]"
        >
          <option value="">كل الحالات</option>
          {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {canManage && <Button onClick={() => setShowCreate(true)}>+ إضافة عقار</Button>}
      </div>
      {showCreate && (
        <Modal title="إضافة عقار" onClose={() => setShowCreate(false)}>
          <PropertyForm
            mode="create"
            accessToken={accessToken}
            role={role}
            submitLabel="إضافة العقار"
            onSubmit={async (input) => {
              const { property } = await createProperty(accessToken, input as PropertyInput);
              router.push(`/properties/${property.id}`);
            }}
          />
        </Modal>
      )}
      <Card className="overflow-hidden">
        {properties === null ? (
          <TableSkeleton columns={4} />
        ) : properties.length === 0 ? (
          <p className="text-text-secondary p-6 text-center">لا توجد عقارات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-5 py-3 font-medium">العنوان</th>
                  <th className="px-5 py-3 font-medium">النوع</th>
                  <th className="px-5 py-3 font-medium">السعر</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-border-subtle border-t">
                    <td className="px-5 py-3">
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-text-primary hover:text-brand font-medium"
                      >
                        {property.title_ar}
                      </Link>
                    </td>
                    <td className="text-text-secondary px-5 py-3">
                      {PROPERTY_TYPE_LABELS[property.property_type]} ·{' '}
                      {LISTING_TYPE_LABELS[property.listing_type]}
                    </td>
                    <td className="text-text-secondary px-5 py-3" dir="ltr">
                      {property.price.toLocaleString('en-US')} ر.س
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        status={property.status}
                        label={PROPERTY_STATUS_LABELS[property.status]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function BuildingsPanel({ accessToken, canManage }: { accessToken: string; canManage: boolean }) {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listBuildings(accessToken).then((result) => {
      if (!cancelled) setBuildings(result.buildings);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <>
      <div className="mb-5 flex items-center justify-end">
        {canManage && <Button onClick={() => setShowCreate(true)}>+ إضافة عمارة</Button>}
      </div>
      {showCreate && (
        <Modal title="إضافة عمارة" onClose={() => setShowCreate(false)}>
          <BuildingForm
            mode="create"
            accessToken={accessToken}
            submitLabel="إضافة العمارة"
            onSubmit={async (input) => {
              const { building } = await createBuilding(accessToken, input as BuildingInput);
              router.push(`/buildings/${building.id}`);
            }}
          />
        </Modal>
      )}
      <Card className="overflow-hidden">
        {buildings === null ? (
          <TableSkeleton columns={2} />
        ) : buildings.length === 0 ? (
          <p className="text-text-secondary p-6 text-center">لا توجد عمارات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-5 py-3 font-medium">اسم العمارة</th>
                  <th className="px-5 py-3 font-medium">عدد الطوابق</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((building) => (
                  <tr key={building.id} className="border-border-subtle border-t">
                    <td className="px-5 py-3">
                      <Link
                        href={`/buildings/${building.id}`}
                        className="text-text-primary hover:text-brand font-medium"
                      >
                        {building.name_ar}
                      </Link>
                    </td>
                    <td className="text-text-secondary px-5 py-3">
                      {building.floors_count ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function ProjectsPanel({ accessToken, canManage }: { accessToken: string; canManage: boolean }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listProjects(accessToken).then((result) => {
      if (!cancelled) setProjects(result.projects);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <>
      <div className="mb-5 flex items-center justify-end">
        {canManage && <Button onClick={() => setShowCreate(true)}>+ إضافة مشروع</Button>}
      </div>
      {showCreate && (
        <Modal title="إضافة مشروع" onClose={() => setShowCreate(false)}>
          <ProjectForm
            mode="create"
            submitLabel="إضافة المشروع"
            onSubmit={async (input) => {
              const { project } = await createProject(accessToken, input as ProjectInput);
              router.push(`/projects/${project.id}`);
            }}
          />
        </Modal>
      )}
      <Card className="overflow-hidden">
        {projects === null ? (
          <TableSkeleton columns={2} />
        ) : projects.length === 0 ? (
          <p className="text-text-secondary p-6 text-center">
            لا توجد مشاريع بعد — تجميع اختياري لعقاراتك تحت مشروع واحد (مثل مشروع سكني متعدد
            العمارات)
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-5 py-3 font-medium">اسم المشروع</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-border-subtle border-t">
                    <td className="px-5 py-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-text-primary hover:text-brand font-medium"
                      >
                        {project.name_ar}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        status={project.status}
                        label={PROPERTY_STATUS_LABELS[project.status]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function RentalsPanel({ accessToken }: { accessToken: string }) {
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[] | null>(null);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [statusFilter, setStatusFilter] = useState<RentalStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listProperties(accessToken).then((result) => {
      if (cancelled) return;
      setProperties(
        Object.fromEntries(result.properties.map((property) => [property.id, property])),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    void listRentals(accessToken, statusFilter ? { status: statusFilter } : {}).then((result) => {
      if (!cancelled) setRentals(result.rentals);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, statusFilter]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RentalStatus | '')}
          className="w-[200px]"
        >
          <option value="">كل الحالات</option>
          {Object.entries(RENTAL_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button onClick={() => setShowCreate(true)}>+ إضافة إيجار</Button>
      </div>
      {showCreate && (
        <Modal title="إضافة إيجار" onClose={() => setShowCreate(false)}>
          <RentalForm
            mode="create"
            accessToken={accessToken}
            submitLabel="إضافة الإيجار"
            onSubmit={async (input) => {
              const { rental } = await createRental(accessToken, input as RentalInput);
              router.push(`/rentals/${rental.id}`);
            }}
          />
        </Modal>
      )}
      <Card className="overflow-hidden">
        {rentals === null ? (
          <TableSkeleton columns={5} />
        ) : rentals.length === 0 ? (
          <p className="text-text-secondary p-6 text-center">لا توجد عقود إيجار بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-5 py-3 font-medium">العقار</th>
                  <th className="px-5 py-3 font-medium">المستأجر</th>
                  <th className="px-5 py-3 font-medium">الإيجار</th>
                  <th className="px-5 py-3 font-medium">نهاية العقد</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => (
                  <tr key={rental.id} className="border-border-subtle border-t">
                    <td className="px-5 py-3">
                      <Link
                        href={`/rentals/${rental.id}`}
                        className="text-text-primary hover:text-brand font-medium"
                      >
                        {properties[rental.property_id]?.title_ar ?? rental.property_id}
                      </Link>
                    </td>
                    <td className="text-text-secondary px-5 py-3">{rental.tenant_name}</td>
                    <td className="text-text-secondary px-5 py-3" dir="ltr">
                      {rental.rent_amount.toLocaleString('en-US')} ر.س
                    </td>
                    <td className="text-text-secondary px-5 py-3" dir="ltr">
                      {formatDate(rental.contract_end_date)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={rental.status} label={RENTAL_STATUS_LABELS[rental.status]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

function PropertiesPageContent() {
  const { me, accessToken } = useCurrentUser();
  const searchParams = useSearchParams();
  const kind = (searchParams.get('kind') as PropertyKind | null) ?? 'units';

  // PRODUCT_SPEC.md section 8: Agent has no owner_admin_manage policy on
  // properties/projects/buildings (no insert/delete) — hide the action
  // rather than show a button that would 403.
  const canManage = me.user.role !== 'agent';

  return (
    <AppShell
      title={KIND_TITLES[kind]}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mb-5">
        <KindTabs active={kind} />
      </div>
      {kind === 'units' && (
        <UnitsPanel accessToken={accessToken} role={me.user.role} canManage={canManage} />
      )}
      {kind === 'buildings' && <BuildingsPanel accessToken={accessToken} canManage={canManage} />}
      {kind === 'projects' && <ProjectsPanel accessToken={accessToken} canManage={canManage} />}
      {kind === 'rentals' && <RentalsPanel accessToken={accessToken} />}
    </AppShell>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={null}>
      <PropertiesPageContent />
    </Suspense>
  );
}
