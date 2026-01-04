/**
 * Admin Panel Page - User management (simplified)
 */
import Navbar from '../components/common/Navbar';

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Admin Panel</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-gray-600 text-center py-12">
            Admin user management features coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
