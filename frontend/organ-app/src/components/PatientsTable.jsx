import {useState, useEffect} from 'react';

function PatientsTable(){
    const [patients,setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


useEffect (()=>{
    fetch('http://localhost:5000/api/patients')
    .then ((res) =>{
        if (!res.ok) throw new Error ('Network response was not ok');
        return res.json();
    })
    .then((data)=>{
        setPatients(data);
        setLoading(false);
    })
    .catch((err) => {
        setError(err.message);
        setLoading(false);
    });
},[]);

if (loading) return <p>Loading students ...</p>
if (error) return <p>Error: {error}</p>


return(
    <table border="1" cellPadding = "8" style = {{borderCollapse: 'collapse'}}>
    <thead>
    <tr>
    <th>ID</th>
    <th>Name</th>
    <th>Organ</th>
    <th>Blood Type</th>
    </tr>
    </thead>
    <tbody>
    {patients.map((patient) => (
        <tr key = {patient.patient_id}>
        <td>{patient.patient_id}</td>
        <td>{patient.name}</td>
        <td>{patient.organ_type}</td>
        <td>{patient.blood_type}</td>

        </tr>

    ))}
    </tbody>
    </table>
);
}

export default PatientsTable;