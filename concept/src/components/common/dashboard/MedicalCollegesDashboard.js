import React from 'react';

const StatCard = ({ icon, title, value, subValue, subText, mainColor, hasBorder }) => (
    <div style={{
        backgroundColor: mainColor,
        color: 'white',
        borderRadius: '12px',
        padding: '18px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
    }}>
        {icon && <div style={{ width: '30px', height: '30px' }}>{icon}</div>}
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{title}</h3>
        <div style={{ fontSize: '40px', fontWeight: '700', lineHeight: 1 }}>{value}</div>
        {subValue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '20px', fontWeight: '600' }}>{subValue}</div>
                <span style={{ fontSize: '14px' }}>Seats</span>
            </div>
        )}
    </div>
);

const SmallStatCard = ({ title, value, subText, mainColor }) => (
    <div style={{
        textAlign: 'center',
        padding: '12px',
    }}>
        <div style={{ fontSize: '22px', fontWeight: '700' }}>
            {title} <span style={{ color: mainColor, fontSize: '18px' }}>{value} Colleges</span>
        </div>
        <div style={{ fontSize: '16px', color: '#4A5568' }}>{subText}</div>
    </div>
);

const MedicalCollegesDashboard = ({title}) => {
    const mainColor = '#076B37'; // A deep blue color

    const icons = {
        college: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        seats: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zm0 6v2m0-2a2 2 0 100 4 2 2 0 000-4zm-6 4v-2m0 2a2 2 0 100-4 2 2 0 000 4zm12 0v-2m0 2a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
        ),
        govt: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
        ),
        private: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
        ),
    };

    return (
        <div style={{ padding: '18px', backgroundColor: '#f3f4f6' }}>
            <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 'bold', color: '#111827', marginBottom: '18px' }}>
                {title}
            </h1>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
            }}>
                <StatCard 
                    icon={icons.college}
                    title="Total Medical Colleges in India"
                    value="780"
                    mainColor={mainColor}
                />
                <StatCard 
                    icon={icons.seats}
                    title="Total Number of MBBS Seats"
                    value="118190"
                    mainColor={mainColor}
                />
                <StatCard 
                    icon={icons.govt}
                    title="Govt. Colleges"
                    subText="(Including AIIMS & JIPMER)"
                    value="427"
                    subValue="59728"
                    mainColor={mainColor}
                    hasBorder
                />
                <StatCard 
                    icon={icons.private}
                    title="Private Colleges & Deemed Universities"
                    value="353"
                    subValue="58462"
                    mainColor={mainColor}
                />
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '30px',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '18px'
            }}>
                <SmallStatCard title="AIIMS" value="20" subText="2207 Seats" mainColor={mainColor} />
                <SmallStatCard title="JIPMER" value="02" subText="243 Seats" mainColor={mainColor} />
            </div>
        </div>
    );
};

export const StateWiseDashboard = ({title}) => {
    const mainColor = '#076B37'; // A deep blue color

    const icons = {
        college: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        seats: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zm0 6v2m0-2a2 2 0 100 4 2 2 0 000-4zm-6 4v-2m0 2a2 2 0 100-4 2 2 0 000 4zm12 0v-2m0 2a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
        ),
        govt: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
        ),
        private: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-9.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
        ),
    };

    return (
        <div style={{ padding: '12px', backgroundColor: '#f3f4f6' }}>
            <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '18px' }}>
                {title}
            </h1>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
            }}>
                <StatCard 
                    icon={icons.college}
                    title="Total MBBS Colleges in Rajasthan"
                    value="43"
                    mainColor={mainColor}
                />
                <StatCard 
                    icon={icons.seats}
                    title="Total Number of MBBS Seats in Rajasthan"
                    value="6476"
                    mainColor={mainColor}
                />
                <StatCard 
                    icon={icons.govt}
                    title="Govt. MBBS Colleges in Rajasthan"
                    subText="(Including AIIMS & JIPMER)"
                    value="31"
                    subValue="4426"
                    mainColor={mainColor}
                    hasBorder
                />
                <StatCard 
                    icon={icons.private}
                    title="Private Colleges & Deemed Universities"
                    value="12"
                    subValue="2050"
                    mainColor={mainColor}
                />
            </div>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '30px',
                borderTop: '1px solid #e5e7eb',
                paddingTop: '18px'
            }}>
                <SmallStatCard title="AIIMS" value="1" subText="125 Seats" mainColor={mainColor} />
                <SmallStatCard title="Dental Colleges" value="16" subText="1550 Seats" mainColor={mainColor} />
            </div>
        </div>
    );
};

export default MedicalCollegesDashboard; 