import Form from '@/app/ui/customers/create-form';
import Breadcrumbs from '@/app/ui/customers/breadcrumbs';

export default async function CreateCustomerPage() {
  return (
    <>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          { label: 'Create Customer', href: '/dashboard/customers/create', active: true },
        ]}
      />
      <Form />
    </>
  );
}
