"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Navbar from "@/app/_components/Navbar";
import api from "@/lib/api";
import useAuth from "@/context/AuthContext";

interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified?: boolean;
  isHostVerified?: boolean;
  createdAt: string;
}

interface VerificationItem {
  _id: string;
  userId?: {
    name?: string;
    email?: string;
  };
  documentType?: string;
  submittedAt?: string;
  status?: string;
}

interface AccommodationItem {
  _id: string;
  title: string;
  hostId?: {
    name?: string;
  };
  type?: string;
  pricePerNight?: number;
  isApprovedByAdmin?: boolean;
}

interface AuditLogItem {
  _id: string;
  timestamp?: string;
  action?: string;
  userId?: {
    name?: string;
    email?: string;
  };
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}

interface IPBlockItem {
  _id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  expiresAt?: string | null;
  permanent?: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "users" | "verifications" | "accommodations" | "audit" | "ipblocks"
  >("users");
  const [users, setUsers] = useState<UserItem[]>([]);
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [accommodations, setAccommodations] = useState<AccommodationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [ipBlocks, setIpBlocks] = useState<IPBlockItem[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [loadingAccommodations, setLoadingAccommodations] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [loadingIPBlocks, setLoadingIPBlocks] = useState(true);
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [auditPage, setAuditPage] = useState(1);
  const [auditPages, setAuditPages] = useState(1);
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");
  const [permanentBlock, setPermanentBlock] = useState(false);
  const [durationHours, setDurationHours] = useState("24");
  const [submittingBlock, setSubmittingBlock] = useState(false);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const isAdmin = useMemo(() => user?.role === "admin", [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
      return;
    }

    if (!loading && user && user.role !== "admin") {
      router.replace("/");
      return;
    }

    if (!loading && user?.role === "admin") {
      fetchAll();
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (activeTab === "audit") {
      fetchAuditLogs(auditPage);
    }
  }, [activeTab, auditPage]);

  const fetchAll = async () => {
    await Promise.all([
      fetchUsers(),
      fetchVerifications(),
      fetchAccommodations(),
      fetchIPBlocks(),
    ]);
  };

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get("/admin/users");
      setUsers(response.data?.users || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load users",
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchVerifications = async () => {
    try {
      setLoadingVerifications(true);
      const response = await api.get("/host-verification/admin/all");
      setVerifications(response.data?.verifications || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load host verifications",
      );
    } finally {
      setLoadingVerifications(false);
    }
  };

  const fetchAccommodations = async () => {
    try {
      setLoadingAccommodations(true);
      const response = await api.get("/accommodations?limit=50");
      setAccommodations(response.data?.accommodations || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load accommodations",
      );
    } finally {
      setLoadingAccommodations(false);
    }
  };

  const fetchAuditLogs = async (page = auditPage) => {
    try {
      setLoadingAudit(true);
      const response = await api.get(
        `/admin/users/audit-logs?page=${page}&limit=50`,
      );
      setAuditLogs(response.data?.logs || []);
      setAuditPages(response.data?.pagination?.pages || 1);
      setAuditPage(response.data?.pagination?.page || page);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load audit logs",
      );
    } finally {
      setLoadingAudit(false);
    }
  };

  const fetchIPBlocks = async () => {
    try {
      setLoadingIPBlocks(true);
      const response = await api.get("/admin/ip-blocks");
      setIpBlocks(response.data?.blocks || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load IP blocks",
      );
    } finally {
      setLoadingIPBlocks(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      toast.success("User role updated");
      await fetchUsers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update role",
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success("User deleted");
      await fetchUsers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete user",
      );
    }
  };

  const handleApproveVerification = async (id: string) => {
    try {
      await api.put(`/host-verification/admin/${id}/approve`);
      toast.success("Verification approved");
      await fetchVerifications();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve verification",
      );
    }
  };

  const handleRejectVerification = async (id: string) => {
    const reason = rejectReason[id]?.trim();
    if (!reason) {
      toast.error("Please enter a rejection reason");
      return;
    }

    try {
      await api.put(`/host-verification/admin/${id}/reject`, { reason });
      toast.success("Verification rejected");
      setRejectReason((prev) => ({ ...prev, [id]: "" }));
      await fetchVerifications();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to reject verification",
      );
    }
  };

  const handleApproveAccommodation = async (id: string) => {
    try {
      await api.put(`/accommodations/admin/${id}/approve`);
      toast.success("Accommodation approved");
      await fetchAccommodations();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to approve accommodation",
      );
    }
  };

  const handleUnblockIP = async (ip: string) => {
    try {
      await api.delete(`/admin/ip-blocks/${ip}`);
      toast.success("IP unblocked");
      await fetchIPBlocks();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to unblock IP",
      );
    }
  };

  const handleAddBlock = async (event: FormEvent) => {
    event.preventDefault();
    if (!newIp || !newReason) {
      toast.error("Please fill IP and reason");
      return;
    }

    try {
      setSubmittingBlock(true);
      await api.post("/admin/ip-blocks", {
        ipAddress: newIp,
        reason: newReason,
        permanent: permanentBlock,
        durationHours: Number(durationHours) || 24,
      });
      toast.success("IP blocked");
      setNewIp("");
      setNewReason("");
      setPermanentBlock(false);
      setDurationHours("24");
      await fetchIPBlocks();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error.message || "Failed to block IP",
      );
    } finally {
      setSubmittingBlock(false);
    }
  };

  const filteredVerifications = useMemo(() => {
    if (verificationFilter === "all") return verifications;
    return verifications.filter((item) => item.status === verificationFilter);
  }, [verifications, verificationFilter]);

  const renderValue = (value: unknown) =>
    typeof value === "string" ? value : JSON.stringify(value);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          Loading...
        </main>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage users, host verification, listings, audit activity, and
            blocked IPs.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { key: "users", label: "Users" },
            { key: "verifications", label: "Host Verifications" },
            { key: "accommodations", label: "Accommodations" },
            { key: "audit", label: "Audit Logs" },
            { key: "ipblocks", label: "IP Blocks" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${activeTab === tab.key ? "btn-primary" : "btn-secondary"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
          <section className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              {loadingUsers ? (
                <div className="p-6">Loading users...</div>
              ) : users.length === 0 ? (
                <div className="p-6 text-gray-600">No users found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Email Verified
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Host Verified
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Created At
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {users.map((userItem) => (
                      <tr key={userItem._id}>
                        <td className="px-4 py-3">{userItem.name}</td>
                        <td className="px-4 py-3">{userItem.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={userItem.role}
                            onChange={(event) =>
                              handleRoleChange(userItem._id, event.target.value)
                            }
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                          >
                            <option value="traveler">Traveler</option>
                            <option value="host">Host</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {userItem.isEmailVerified ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-3">
                          {userItem.isHostVerified ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-3">
                          {new Date(userItem.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteUser(userItem._id)}
                            className="btn-danger text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activeTab === "verifications" && (
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                Filter
              </label>
              <select
                value={verificationFilter}
                onChange={(event) => setVerificationFilter(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {loadingVerifications ? (
              <div className="card p-6">Loading host verifications...</div>
            ) : filteredVerifications.length === 0 ? (
              <div className="card p-6 text-gray-600">
                No host verifications found.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVerifications.map((item) => (
                  <article key={item._id} className="card p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.userId?.name || "Unknown user"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.userId?.email || "No email"}
                        </p>
                        <p className="mt-2 text-sm text-gray-700">
                          Document: {item.documentType || "N/A"}
                        </p>
                        <p className="text-sm text-gray-700">
                          Submitted:{" "}
                          {item.submittedAt
                            ? new Date(item.submittedAt).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${item.status === "approved" ? "badge-verified" : item.status === "pending" ? "badge-pending" : "bg-red-100 text-red-700 border border-red-200"}`}
                        >
                          {item.status || "pending"}
                        </span>
                        {item.status !== "approved" && (
                          <button
                            onClick={() => handleApproveVerification(item._id)}
                            className="btn-primary text-sm"
                          >
                            Approve
                          </button>
                        )}
                        {item.status !== "approved" && (
                          <div className="flex flex-col gap-2">
                            <input
                              value={rejectReason[item._id] || ""}
                              onChange={(event) =>
                                setRejectReason((prev) => ({
                                  ...prev,
                                  [item._id]: event.target.value,
                                }))
                              }
                              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                              placeholder="Rejection reason"
                            />
                            <button
                              onClick={() => handleRejectVerification(item._id)}
                              className="btn-danger text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === "accommodations" && (
          <section className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              {loadingAccommodations ? (
                <div className="p-6">Loading accommodations...</div>
              ) : accommodations.length === 0 ? (
                <div className="p-6 text-gray-600">
                  No accommodations found.
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Host
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {accommodations.map((item) => (
                      <tr key={item._id}>
                        <td className="px-4 py-3">{item.title}</td>
                        <td className="px-4 py-3">
                          {item.hostId?.name || "Unknown"}
                        </td>
                        <td className="px-4 py-3">{item.type}</td>
                        <td className="px-4 py-3">
                          Rs. {item.pricePerNight?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {item.isApprovedByAdmin ? (
                            <span className="badge-verified">Approved</span>
                          ) : (
                            <span className="badge-pending">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!item.isApprovedByAdmin && (
                            <button
                              onClick={() =>
                                handleApproveAccommodation(item._id)
                              }
                              className="btn-primary text-sm"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activeTab === "audit" && (
          <section>
            {loadingAudit ? (
              <div className="card p-6">Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="card p-6 text-gray-600">No audit logs found.</div>
            ) : (
              <div className="space-y-4">
                <div className="card overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Timestamp
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Action
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            User
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            IP
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">
                            Metadata
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {auditLogs.map((log) => (
                          <tr key={log._id}>
                            <td className="px-4 py-3">
                              {log.timestamp
                                ? new Date(log.timestamp).toLocaleString()
                                : "—"}
                            </td>
                            <td className="px-4 py-3">{log.action}</td>
                            <td className="px-4 py-3">
                              {log.userId?.name ||
                                log.userId?.email ||
                                "System"}
                            </td>
                            <td className="px-4 py-3">
                              {log.ipAddress || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {renderValue(log.metadata)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      setAuditPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={auditPage === 1}
                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {auditPage} of {auditPages}
                  </span>
                  <button
                    onClick={() => setAuditPage((prev) => prev + 1)}
                    disabled={auditPage >= auditPages}
                    className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "ipblocks" && (
          <section className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Add IP block
              </h2>
              <form
                onSubmit={handleAddBlock}
                className="mt-4 grid gap-4 md:grid-cols-2"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    IP address
                  </label>
                  <input
                    value={newIp}
                    onChange={(event) => setNewIp(event.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Reason
                  </label>
                  <input
                    value={newReason}
                    onChange={(event) => setNewReason(event.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Permanent
                  </label>
                  <input
                    type="checkbox"
                    checked={permanentBlock}
                    onChange={(event) =>
                      setPermanentBlock(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Duration hours
                  </label>
                  <input
                    type="number"
                    value={durationHours}
                    onChange={(event) => setDurationHours(event.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    disabled={permanentBlock}
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submittingBlock}
                  >
                    {submittingBlock ? "Blocking..." : "Block IP"}
                  </button>
                </div>
              </form>
            </div>

            <div className="card overflow-hidden p-0">
              {loadingIPBlocks ? (
                <div className="p-6">Loading IP blocks...</div>
              ) : ipBlocks.length === 0 ? (
                <div className="p-6 text-gray-600">No IP blocks found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          IP address
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Reason
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Blocked at
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Expires at
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {ipBlocks.map((item) => (
                        <tr key={item._id}>
                          <td className="px-4 py-3">{item.ipAddress}</td>
                          <td className="px-4 py-3">{item.reason}</td>
                          <td className="px-4 py-3">
                            {new Date(item.blockedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {item.permanent ? (
                              <span className="badge-verified">Permanent</span>
                            ) : item.expiresAt ? (
                              new Date(item.expiresAt).toLocaleString()
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleUnblockIP(item.ipAddress)}
                              className="btn-danger text-sm"
                            >
                              Unblock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
