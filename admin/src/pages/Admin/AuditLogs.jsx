import React, { useEffect, useState, useContext } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';

const AuditLogs = () => {
  const { aToken } = useContext(AdminContext);
  const { backendUrl } = useContext(AppContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${backendUrl}/api/admin/audit-logs`, {
          headers: { aToken },
        });
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs || []);
        } else {
          setError(data.message || 'Failed to fetch audit logs');
        }
      } catch (err) {
        setError('Network error');
      }
      setLoading(false);
    };
    if (aToken && backendUrl) fetchLogs();
  }, [aToken, backendUrl]);

  return (
    <div className="m-5">
      <h2 className="text-xl font-bold mb-4">Audit Logs</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded">
          <thead>
            <tr>
              <th className="px-3 py-2 border">Time</th>
              <th className="px-3 py-2 border">Actor</th>
              <th className="px-3 py-2 border">Type</th>
              <th className="px-3 py-2 border">Action</th>
              <th className="px-3 py-2 border">Status</th>
              <th className="px-3 py-2 border">Path</th>
              <th className="px-3 py-2 border">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={idx} className="text-xs">
                <td className="px-3 py-2 border">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 border">{log.actorName || log.actorId}</td>
                <td className="px-3 py-2 border">{log.actorType}</td>
                <td className="px-3 py-2 border">{log.action}</td>
                <td className="px-3 py-2 border">{log.statusCode}</td>
                <td className="px-3 py-2 border">{log.path}</td>
                <td className="px-3 py-2 border">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogs;
