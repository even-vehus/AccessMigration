import { NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <span className="navbar-brand">Northwind</span>
      <div className="navbar-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/customers">Customers</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/orders">Orders</NavLink>
        <NavLink to="/employees">Employees</NavLink>
      </div>
    </nav>
  );
}
