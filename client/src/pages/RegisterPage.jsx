import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { normalizeIndianPhone, stripPhoneToDigits } from "../utils/phone";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("donor");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    bloodGroup: "A+",
    city: "",
    pincode: "",
    organs: [],
    lastDonatedAt: "",
    smsAlertsEnabled: true,
    hospitalName: "",
    hospitalLicenseNumber: "",
    idProofBase64: ""
  });

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "phone" ? stripPhoneToDigits(value).slice(-10) : value
    }));
  };

  const handleOrgan = (organ) => {
    setForm((prev) => ({
      ...prev,
      organs: prev.organs.includes(organ) ? prev.organs.filter((item) => item !== organ) : [...prev.organs, organ]
    }));
  };

  const encodeFile = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, idProofBase64: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setFieldErrors({});
    try {
      const basePayload = {
        name: form.name,
        phone: normalizeIndianPhone(form.phone),
        email: form.email,
        city: form.city,
        pincode: form.pincode,
        smsAlertsEnabled: form.smsAlertsEnabled,
        role
      };

      const rolePayload =
        role === "donor"
          ? {
              bloodGroup: form.bloodGroup,
              organs: form.organs,
              lastDonatedAt: form.lastDonatedAt || "",
              idProofBase64: form.idProofBase64 || undefined
            }
          : {
              hospitalName: form.hospitalName,
              hospitalLicenseNumber: form.hospitalLicenseNumber
            };

      await api.post("/auth/register", { ...basePayload, ...rolePayload });
      setMessage("Registration successful. Please login with OTP.");
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      const nextFieldErrors = error.response?.data?.error?.fields || {};
      setFieldErrors(nextFieldErrors);
      const firstFieldError = Object.values(nextFieldErrors)[0]?.[0];
      setMessage(firstFieldError || error.response?.data?.error?.message || error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Register</h1>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setRole("donor")}
          className={`rounded-lg px-4 py-2 ${role === "donor" ? "bg-blood text-white" : "bg-slate-100"}`}
        >
          Donor
        </button>
        <button
          type="button"
          onClick={() => setRole("recipient")}
          className={`rounded-lg px-4 py-2 ${role === "recipient" ? "bg-organ text-white" : "bg-slate-100"}`}
        >
          Recipient/Hospital
        </button>
      </div>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="name">Full Name</label>
          <input id="name" required name="name" value={form.name} onChange={update} placeholder="Aditya Chhikara" className="w-full rounded-lg border px-3 py-2" />
          {fieldErrors.name?.[0] && <p className="text-xs text-red-600">{fieldErrors.name[0]}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="phone">Phone Number</label>
          <div className="flex overflow-hidden rounded-lg border">
            <span className="flex items-center bg-slate-50 px-3 text-sm text-slate-500">+91</span>
            <input id="phone" required name="phone" value={form.phone} onChange={update} placeholder="9876543210" className="w-full px-3 py-2 outline-none" />
          </div>
          <p className="text-xs text-slate-500">Enter your 10-digit Indian mobile number.</p>
          {fieldErrors.phone?.[0] && <p className="text-xs text-red-600">{fieldErrors.phone[0]}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
          <input id="email" name="email" value={form.email} onChange={update} placeholder="name@example.com" className="w-full rounded-lg border px-3 py-2" />
          {fieldErrors.email?.[0] && <p className="text-xs text-red-600">{fieldErrors.email[0]}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="city">City</label>
          <input id="city" required name="city" value={form.city} onChange={update} placeholder="Chandigarh" className="w-full rounded-lg border px-3 py-2" />
          {fieldErrors.city?.[0] && <p className="text-xs text-red-600">{fieldErrors.city[0]}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700" htmlFor="pincode">Pincode</label>
          <input id="pincode" required name="pincode" value={form.pincode} onChange={update} placeholder="160002" className="w-full rounded-lg border px-3 py-2" />
          {fieldErrors.pincode?.[0] && <p className="text-xs text-red-600">{fieldErrors.pincode[0]}</p>}
        </div>

        {role === "donor" && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="bloodGroup">Blood Group</label>
              <select id="bloodGroup" name="bloodGroup" value={form.bloodGroup} onChange={update} className="w-full rounded-lg border px-3 py-2">
                {bloodGroups.map((group) => (
                  <option key={group}>{group}</option>
                ))}
              </select>
              {fieldErrors.bloodGroup?.[0] && <p className="text-xs text-red-600">{fieldErrors.bloodGroup[0]}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="lastDonatedAt">Last Donation Date</label>
              <input id="lastDonatedAt" type="date" name="lastDonatedAt" value={form.lastDonatedAt} onChange={update} className="w-full rounded-lg border px-3 py-2" />
            </div>
          </>
        )}

        {role === "recipient" && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="hospitalName">Hospital Name</label>
              <input id="hospitalName" name="hospitalName" required value={form.hospitalName} onChange={update} placeholder="Chhikara Hospital" className="w-full rounded-lg border px-3 py-2" />
              {fieldErrors.hospitalName?.[0] && <p className="text-xs text-red-600">{fieldErrors.hospitalName[0]}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="hospitalLicenseNumber">Hospital License Number</label>
              <input
                id="hospitalLicenseNumber"
                name="hospitalLicenseNumber"
                required
                value={form.hospitalLicenseNumber}
                onChange={update}
                placeholder="HSP-DEL-1022"
                className="w-full rounded-lg border px-3 py-2"
              />
              <p className="text-xs text-slate-500">Use a valid medical license format like `HSP-DEL-1022`.</p>
              {fieldErrors.hospitalLicenseNumber?.[0] && <p className="text-xs text-red-600">{fieldErrors.hospitalLicenseNumber[0]}</p>}
            </div>
          </>
        )}

        {role === "donor" && (
          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-semibold">Organ Consent</p>
            <div className="flex flex-wrap gap-2">
              {["eyes", "kidney", "liver", "heart"].map((organ) => (
                <button
                  key={organ}
                  type="button"
                  onClick={() => handleOrgan(organ)}
                  className={`rounded-full px-3 py-1 text-sm ${form.organs.includes(organ) ? "bg-organ text-white" : "bg-slate-100"}`}
                >
                  {organ}
                </button>
              ))}
            </div>
          </div>
        )}

        {role === "donor" && (
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold" htmlFor="idProof">
              Government ID Upload
            </label>
            <input id="idProof" type="file" accept="image/*,.pdf" onChange={(e) => encodeFile(e.target.files?.[0])} />
          </div>
        )}

        <label className="md:col-span-2 flex items-center gap-2 text-sm">
          <input type="checkbox" name="smsAlertsEnabled" checked={form.smsAlertsEnabled} onChange={update} />
          Opt-in for SMS alerts
        </label>

        <button disabled={loading} className="md:col-span-2 rounded-lg bg-blood px-4 py-3 font-semibold text-white">
          {loading ? "Submitting..." : "Create Account"}
        </button>
      </form>

      {message && <p className={`mt-3 text-sm ${fieldErrors && Object.keys(fieldErrors).length ? "text-red-600" : "text-slate-700"}`}>{message}</p>}
    </div>
  );
};

export default RegisterPage;
