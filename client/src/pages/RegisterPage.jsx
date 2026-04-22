import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { normalizeIndianPhone, stripPhoneToDigits } from "../utils/phone";

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const organs = ["eyes", "kidney", "liver", "heart"];

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder-slate-500 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blood/40 focus:border-blood";

const labelClass = "text-sm font-semibold text-slate-800";
const helperClass = "text-xs text-slate-600";
const errorClass = "text-xs text-red-600";

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
      if (!error.response) {
        setMessage("Cannot reach server. Check backend URL/CORS settings.");
      } else {
        const rawData = error.response?.data;
        const fallbackHttpMessage = `Registration failed (HTTP ${error.response?.status || "unknown"})`;
        const parsedMessage =
          firstFieldError ||
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          (typeof rawData === "string" ? rawData : "") ||
          fallbackHttpMessage;
        setMessage(parsedMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-b from-white to-slate-50 p-6 md:p-8 shadow-xl border border-slate-200">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Register</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Create your donor or hospital account with clear and secure details.</p>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => setRole("donor")}
          className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
            role === "donor" ? "bg-blood text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          Donor
        </button>
        <button
          type="button"
          onClick={() => setRole("recipient")}
          className={`rounded-lg px-4 py-2 font-semibold transition-colors ${
            role === "recipient" ? "bg-organ text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
          }`}
        >
          Recipient/Hospital
        </button>
      </div>

      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="name">Full Name</label>
          <input id="name" required name="name" value={form.name} onChange={update} placeholder="Aditya Chhikara" className={inputClass} />
          {fieldErrors.name?.[0] && <p className={errorClass}>{fieldErrors.name[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="phone">Phone Number</label>
          <div className="flex overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blood/40 focus-within:border-blood">
            <span className="flex items-center bg-slate-100 px-3 text-sm font-medium text-slate-700 border-r border-slate-300">+91</span>
            <input id="phone" required name="phone" value={form.phone} onChange={update} placeholder="9876543210" className="w-full px-3 py-2 text-slate-900 outline-none" />
          </div>
          <p className={helperClass}>Enter your 10-digit Indian mobile number.</p>
          {fieldErrors.phone?.[0] && <p className={errorClass}>{fieldErrors.phone[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" name="email" value={form.email} onChange={update} placeholder="name@example.com" className={inputClass} />
          {fieldErrors.email?.[0] && <p className={errorClass}>{fieldErrors.email[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="city">City</label>
          <input id="city" required name="city" value={form.city} onChange={update} placeholder="Chandigarh" className={inputClass} />
          {fieldErrors.city?.[0] && <p className={errorClass}>{fieldErrors.city[0]}</p>}
        </div>

        <div className="space-y-1.5">
          <label className={labelClass} htmlFor="pincode">Pincode</label>
          <input id="pincode" required name="pincode" value={form.pincode} onChange={update} placeholder="160002" className={inputClass} />
          {fieldErrors.pincode?.[0] && <p className={errorClass}>{fieldErrors.pincode[0]}</p>}
        </div>

        {role === "donor" && (
          <>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="bloodGroup">Blood Group</label>
              <select id="bloodGroup" name="bloodGroup" value={form.bloodGroup} onChange={update} className={inputClass}>
                {bloodGroups.map((group) => (
                  <option key={group}>{group}</option>
                ))}
              </select>
              {fieldErrors.bloodGroup?.[0] && <p className={errorClass}>{fieldErrors.bloodGroup[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="lastDonatedAt">Last Donation Date</label>
              <input id="lastDonatedAt" type="date" name="lastDonatedAt" value={form.lastDonatedAt} onChange={update} className={inputClass} />
            </div>
          </>
        )}

        {role === "recipient" && (
          <>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="hospitalName">Hospital Name</label>
              <input id="hospitalName" name="hospitalName" required value={form.hospitalName} onChange={update} placeholder="Chhikara Hospital" className={inputClass} />
              {fieldErrors.hospitalName?.[0] && <p className={errorClass}>{fieldErrors.hospitalName[0]}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="hospitalLicenseNumber">Hospital License Number</label>
              <input
                id="hospitalLicenseNumber"
                name="hospitalLicenseNumber"
                required
                value={form.hospitalLicenseNumber}
                onChange={update}
                placeholder="HSP-DEL-1022"
                className={inputClass}
              />
              <p className={helperClass}>Use a valid medical license format like `HSP-DEL-1022`.</p>
              {fieldErrors.hospitalLicenseNumber?.[0] && <p className={errorClass}>{fieldErrors.hospitalLicenseNumber[0]}</p>}
            </div>
          </>
        )}

        {role === "donor" && (
          <div className="md:col-span-2">
            <p className={`${labelClass} mb-2`}>Organ Consent</p>
            <div className="flex flex-wrap gap-2">
              {organs.map((organ) => (
                <button
                  key={organ}
                  type="button"
                  onClick={() => handleOrgan(organ)}
                  className={`rounded-full px-3 py-1 text-sm font-semibold capitalize transition-colors ${
                    form.organs.includes(organ)
                      ? "bg-organ text-white"
                      : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                  }`}
                >
                  {organ}
                </button>
              ))}
            </div>
          </div>
        )}

        {role === "donor" && (
          <div className="md:col-span-2 space-y-1.5">
            <label className={labelClass} htmlFor="idProof">Government ID Upload</label>
            <input
              id="idProof"
              type="file"
              accept="image/*,.pdf"
              onChange={(event) => encodeFile(event.target.files?.[0])}
              className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-700 file:px-3 file:py-1.5 file:text-white hover:file:bg-slate-800"
            />
          </div>
        )}

        <label className="md:col-span-2 flex items-center gap-2 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            name="smsAlertsEnabled"
            checked={form.smsAlertsEnabled}
            onChange={update}
            className="h-4 w-4 rounded border-slate-400 text-blood focus:ring-blood"
          />
          Opt-in for SMS alerts
        </label>

        <button disabled={loading} className="md:col-span-2 rounded-lg bg-blood px-4 py-3 font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60">
          {loading ? "Submitting..." : "Create Account"}
        </button>
      </form>

      {message && (
        <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${fieldErrors && Object.keys(fieldErrors).length ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default RegisterPage;
