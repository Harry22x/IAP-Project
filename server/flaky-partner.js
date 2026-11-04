const express = require('express');
const app = express();

let mode = 'slow'; // ok | slow | flaky | error

let calls = 0;

const artisans = {"artisans":[{
            "id": "u-1793217446818",
            "fullname": "Aubrey Graham",
            "phone": "+254755555555",
            "skill": "Cooking",
            "verified": true,
            "bio": "",
            "rate": "Not set yet",
            "blood_type": "AB",
            "rhesus_factor": "positive"
        },
        {
            "id": "u-1793215591999",
            "fullname": "Chris Griffin",
            "phone": "+254744444444",
            "skill": "Plumbing",
            "verified": true,
            "bio": "",
            "rate": "Not set yet",
            "blood_type": "O",
            "rhesus_factor": "negative"
        },
    
        {
            "id": "u-1793217249947",
            "fullname": "Jake Paul",
            "phone": "+254707728590",
            "skill": "Barber",
            "verified": true,
            "bio": "",
            "rate": "Not set yet",
            "blood_type": "AB",
            "rhesus_factor": "negative"
        },
        {
            "id": "u-1793200255430",
            "fullname": "Joe Swanson",
            "phone": "+254733333333",
            "skill": "Home and Office Cleaning",
            "verified": true,
            "bio": "Good Cleaner",
            "rate": "500",
            "blood_type": "AB",
            "rhesus_factor": "negative"
        },
        
    ]};

    

app.get('/__mode/:m',(req,res)=>{
    mode = req.params.m;
    calls = 0;
    res.json({mode})
});

app.get('/api/artisans', async (req,res)=>{
    calls += 1;
    console.log(`GET /artisans (call ${calls}, mode ${mode})`);
    if( mode === 'slow'){ // answer after 10 seconds
        await new Promise(r=>setTimeout(r,10000));
    }
    if(mode === 'flaky' && calls % 3 !==0){ // fails twice, then works
        return res.status(503).json({message:'Try again'})
    }
    if(mode === 'error'){// always fails
    return res.status(500).json({message:'Internal error'});    
    }
    res.json(artisans)
});

app.listen(4000,()=> console.log('Stand in partner on http://localhost:4000'))