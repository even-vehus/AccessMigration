import { useData } from '../hooks/useData';
import { api } from '../api';
import './Page.css';
import './Dashboard.css';

export default function Dashboard() {
  const { data: customers } = useData(api.customers.list);
  const { data: products } = useData(api.products.list);
  const { data: orders } = useData(api.orders.list);
  const { data: employees } = useData(api.employees.list);

  const stats = [
    { label: 'Customers', count: customers.length, link: '/customers' },
    { label: 'Products', count: products.length, link: '/products' },
    { label: 'Orders', count: orders.length, link: '/orders' },
    { label: 'Employees', count: employees.length, link: '/employees' },
  ];

  return (
    <div className="page">
      <div className="page-header"><h1>Dashboard</h1></div>
      <div className="stat-cards">
        {stats.map(s => (
          <a key={s.label} href={s.link} className="stat-card">
            <div className="stat-count">{s.count}</div>
            <div className="stat-label">{s.label}</div>
          </a>
        ))}
      </div>
      <div className="recent-section">
        <h2>Recent Orders</h2>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>
              {orders.slice(0, 10).map(o => (
                <tr key={o.OrderID}>
                  <td>{o.OrderID}</td>
                  <td>{o.CustomerName}</td>
                  <td>{o.OrderDate ? new Date(o.OrderDate).toLocaleDateString() : '—'}</td>
                  <td>{o.StatusName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
