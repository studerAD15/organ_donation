import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";

const ProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get(`/donors/public/${id}`).then((response) => setProfile(response.data));
  }, [id]);

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Donor Profile</h1>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-semibold">Name</dt>
          <dd>{profile.name} (anonymized)</dd>
        </div>
        <div>
          <dt className="font-semibold">Blood Group</dt>
          <dd>{profile.bloodGroup}</dd>
        </div>
        <div>
          <dt className="font-semibold">City</dt>
          <dd>{profile.city}</dd>
        </div>
        <div>
          <dt className="font-semibold">Donations</dt>
          <dd>{profile.donationCount}</dd>
        </div>
      </dl>
    </div>
  );
};

export default ProfilePage;
