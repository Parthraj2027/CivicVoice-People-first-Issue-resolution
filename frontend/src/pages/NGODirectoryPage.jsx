import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchNgos } from '@/features/ngo/ngoSlice';
import NGOCard from '@/components/library/NGOCard';
import '@/styles/NGODirectoryPage.css';

const specializationOptions = [
  { value: '', label: 'All specializations' },
  { value: 'child_labour', label: 'Child Labour' },
  { value: 'womens_safety', label: 'Women Safety' },
  { value: 'homelessness', label: 'Homelessness' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'environment', label: 'Environment' },
  { value: 'elder_neglect', label: 'Elder Neglect' },
  { value: 'hunger', label: 'Hunger' },
  { value: 'disability', label: 'Disability' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'discrimination', label: 'Discrimination' },
  { value: 'substance_abuse', label: 'Substance Abuse' },
];

const NGODirectoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, status } = useSelector((state) => state.ngo);
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    const filters = {
      verified: 'true',
    };
    if (search.trim()) filters.q = search.trim();
    if (specialization) filters.specialization = specialization;
    if (city.trim()) filters.city = city.trim();
    dispatch(fetchNgos(filters));
  }, [city, dispatch, search, specialization]);

  const hasFilters = useMemo(() => Boolean(search.trim() || specialization || city.trim()), [city, search, specialization]);

  const resetFilters = () => {
    setSearch('');
    setSpecialization('');
    setCity('');
  };

  return (
    <div className="ngo-directory-page">
      <h1>NGO Directory</h1>
      <p>Find verified partners by specialization and service area.</p>

      <section className="ngo-directory-filters">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by NGO name or support description"
        />
        <select value={specialization} onChange={(event) => setSpecialization(event.target.value)}>
          {specializationOptions.map((option) => (
            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Filter by city"
        />
        <button type="button" onClick={resetFilters} disabled={!hasFilters}>Reset</button>
      </section>

      {status === 'loading' ? <p>Loading NGOs...</p> : null}
      <section className="ngo-grid">
        {list.map((ngo) => (
          <NGOCard key={ngo._id} ngo={ngo} onOpen={() => navigate(`/ngos/${ngo._id}`)} />
        ))}
      </section>
      {status !== 'loading' && list.length === 0 ? <p>No NGO matched your filters yet.</p> : null}
    </div>
  );
};

export default NGODirectoryPage;
