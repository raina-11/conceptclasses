// src/components/SearchPage.jsx
import { useState, useMemo } from 'react';
import placementData from '../data/All_Placement_Stats.json';
import josaaData from '../data/josaa_opening_closing.json';

export default function SearchPage() {
  // ─── Filter state ─────────────────────────────────────────────────────────────
  const [searchRank, setSearchRank] = useState('');       // JOSAA rank
  const [searchBranch, setSearchBranch] = useState('');   // both datasets
  const [searchCollege, setSearchCollege] = useState(''); // both datasets
  const [searchSeatType, setSearchSeatType] = useState(''); // JOSAA only
  const [searchGender, setSearchGender] = useState('');     // JOSAA only

  // ─── Filter Placement Stats ───────────────────────────────────────────────────
  // Only Branch and College apply here.
  const filteredPlacement = useMemo(() => {
    return placementData.filter((row) => {
      // Ensure the JSON file has a `Branch` and `COLLEGE` field exactly.
      const branchMatch =
        String(row.Branch ?? '')
          .toLowerCase()
          .includes(searchBranch.trim().toLowerCase());
      const collegeMatch =
        String(row.COLLEGE ?? '')
          .toLowerCase()
          .includes(searchCollege.trim().toLowerCase());

      return branchMatch && collegeMatch;
    });
  }, [searchBranch, searchCollege]);

  // ─── Filter JOSAA Opening/Closing ───────────────────────────────────────────────
  // Applies: Rank, Branch (Academic Program Name), College (Institute), Seat Type, Gender
  const filteredJosaa = useMemo(() => {
    return josaaData.filter((row) => {
      // 1) Rank filter
      let rankMatch = true;
      if (searchRank.trim() !== '') {
        // parse user input; if it’s not a valid integer, don’t match any row
        const userRank = parseInt(searchRank.trim(), 10);
        const openRankRaw = String(row['Opening Rank'] ?? '').replace(/P$/, '');
        const closeRankRaw = String(row['Closing Rank'] ?? '').replace(/P$/, '');
        const openRank = parseInt(openRankRaw, 10);
        const closeRank = parseInt(closeRankRaw, 10);

        if (
          isNaN(userRank) ||
          isNaN(openRank) ||
          isNaN(closeRank) ||
          userRank < openRank ||
          userRank > closeRank
        ) {
          rankMatch = false;
        }
      }

      // 2) Branch filter: check `'Academic Program Name'`
      const branchMatch =
        String(row['Academic Program Name'] ?? '')
          .toLowerCase()
          .includes(searchBranch.trim().toLowerCase());

      // 3) College filter: check `Institute`
      const collegeMatch =
        String(row.Institute ?? '')
          .toLowerCase()
          .includes(searchCollege.trim().toLowerCase());

      // 4) Seat Type filter
      const seatMatch =
        String(row['Seat Type'] ?? '')
          .toLowerCase()
          .includes(searchSeatType.trim().toLowerCase());

      // 5) Gender filter
      const genderMatch =
        String(row.Gender ?? '')
          .toLowerCase()
          .includes(searchGender.trim().toLowerCase());

      return rankMatch && branchMatch && collegeMatch && seatMatch && genderMatch;
    });
  }, [searchRank, searchBranch, searchCollege, searchSeatType, searchGender]);

  // Uncomment these lines during debugging to see how many rows are left:
  // console.log('filteredPlacement length:', filteredPlacement.length);
  // console.log('filteredJosaa length:', filteredJosaa.length);

  return (
    <div className="p-6 space-y-8 bg-gray-100 min-h-screen">
      {/* ─── Filter Controls ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-md p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Rank (JOSAA) */}
        <div>
          <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
            Rank (JOSAA)
          </label>
          <input
            type="number"
            id="rank"
            value={searchRank}
            onChange={(e) => setSearchRank(e.target.value)}
            placeholder="e.g. 5000"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Branch (both) */}
        <div>
          <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
            Branch
          </label>
          <input
            type="text"
            id="branch"
            value={searchBranch}
            onChange={(e) => setSearchBranch(e.target.value)}
            placeholder="e.g. Computer Science"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* College / Institute (both) */}
        <div>
          <label htmlFor="college" className="block text-sm font-medium text-gray-700">
            College / Institute
          </label>
          <input
            type="text"
            id="college"
            value={searchCollege}
            onChange={(e) => setSearchCollege(e.target.value)}
            placeholder="e.g. IIT Bombay"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Seat Type (JOSAA) */}
        <div>
          <label htmlFor="seatType" className="block text-sm font-medium text-gray-700">
            Seat Type (JOSAA)
          </label>
          <input
            type="text"
            id="seatType"
            value={searchSeatType}
            onChange={(e) => setSearchSeatType(e.target.value)}
            placeholder="OPEN, OBC-NCL, SC, etc."
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        {/* Gender (JOSAA) */}
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
            Gender (JOSAA)
          </label>
          <input
            type="text"
            id="gender"
            value={searchGender}
            onChange={(e) => setSearchGender(e.target.value)}
            placeholder="Gender-Neutral, Female-only…"
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* ─── Placement Stats Table ────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Placement Stats</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">College</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Branch</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Year</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Registered
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Placed</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Placement %
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Lowest CTC
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Highest CTC
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Average CTC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPlacement.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm text-gray-800">{row.COLLEGE}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{row.Branch}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{row.Year}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-right">
                    {row.Registered}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-right">{row.Placed}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-right">
                    {row['Placement %']}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-right">
                    {row['Lowest CTC (LPA)']}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-right">
                    {row['Highest CTC (LPA)']}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-right">
                    {row['Average CTC (LPA)']}
                  </td>
                </tr>
              ))}

              {filteredPlacement.length === 0 && (
                <tr>
                  <td
                    colSpan="9"
                    className="px-4 py-6 text-center text-gray-500 italic"
                  >
                    No placement records match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── JOSAA Opening/Closing Table ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">JOSAA Opening/Closing Ranks</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">College</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Program</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Seat Type</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Gender</th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Opening Rank
                </th>
                <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">
                  Closing Rank
                </th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredJosaa.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-sm text-gray-800">{row.Institute}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">
                    {row['Academic Program Name']}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">{row['Seat Type']}</td>
                  <td className="px-4 py-2 text-sm text-gray-800">{row.Gender}</td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-right">
                    {row['Opening Rank']}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800 text-right">
                    {row['Closing Rank']}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-800">{row.TYPE}</td>
                </tr>
              ))}

              {filteredJosaa.length === 0 && (
                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-6 text-center text-gray-500 italic"
                  >
                    No JOSAA records match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
