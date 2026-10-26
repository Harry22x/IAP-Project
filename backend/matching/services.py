from django.utils import timezone
from .models import Match
from patients.models import Donor, Recipient
from .artisan_client import fetch_artisan_donors

class OrganMatchingService:
    # Blood Type Compatibility Mapping (Recipient -> List of compatible Donor types)
    BLOOD_COMPATIBILITY = {
        'A+': ['A+', 'A-', 'O+', 'O-'],
        'A-': ['A-', 'O-'],
        'B+': ['B+', 'B-', 'O+', 'O-'],
        'B-': ['B-', 'O-'],
        'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], # Universal recipient
        'AB-': ['A-', 'B-', 'AB-', 'O-'],
        'O+': ['O+', 'O-'],
        'O-': ['O-']
    }

    @staticmethod
    def get_compatible_donors(recipient: Recipient):
        from medical_records.models import MedicalRecord
        
        # --- STAGE 1: HARD CONSTRAINTS (Filtering) ---
        compatible_blood_types = OrganMatchingService.BLOOD_COMPATIBILITY.get(
            recipient.recipient_id.blood_type, []
        )

        donors = Donor.objects.filter(
            availability=True, 
            consent_status=True,
            donor_id__organ_type=recipient.recipient_id.organ_type,
            donor_id__blood_type__in=compatible_blood_types,
            donor_id__hospital=recipient.recipient_id.hospital
        )

        matches = []
        for donor in donors:
            # Must have at least one VALID (verified + non-expired) medical record
            # specifically looking for HLA or Crossmatch for higher scoring
            valid_records = MedicalRecord.objects.filter(patient=donor.donor_id)
            
            # Check if donor has any currently valid verified record
            has_valid_clinical_data = any(rec.is_valid for rec in valid_records)
            
            if has_valid_clinical_data:
                # --- STAGE 2: SOFT CONSTRAINTS (Scoring) ---
                score = OrganMatchingService.calculate_weighted_score(donor, recipient, valid_records)
                
                matches.append(Match(
                    donor=donor, 
                    recipient=recipient, 
                    compatibility_score=score, 
                    match_status='PENDING'
                ))
        
        if matches:
            # Delete any existing pending matches for this recipient to avoid duplication
            # if we are re-running for the same person
            Match.objects.filter(recipient=recipient, match_status='PENDING').delete()
            Match.objects.bulk_create(matches)
        
        return Match.objects.filter(recipient=recipient).order_by('-compatibility_score')

    @staticmethod
    def get_producer_matches(recipient: Recipient):
        """ compatible Jua Kali artisans by ABO/Rh only."""
        recipient_blood = recipient.recipient_id.blood_type
        allowed = OrganMatchingService.BLOOD_COMPATIBILITY.get(recipient_blood, [])
        artisan_donors = fetch_artisan_donors()
        # Deduplicate artisans that are already registered as a match for this recipient in DB
        existing_matches = Match.objects.filter(recipient=recipient)
        existing_artisan_ids = set()
        for m in existing_matches:
            if m.donor and '[Jua Kali Artisan:' in (getattr(m.donor.donor_id, 'medical_history', '') or ''):
                try:
                    aid = m.donor.donor_id.medical_history.split('[Jua Kali Artisan:')[1].split(']')[0].strip()
                    existing_artisan_ids.add(aid)
                except Exception:
                    pass

        matches = []
        for donor in artisan_donors:
            if donor["blood_group"] not in allowed:
                continue
            if donor.get("artisan_id") in existing_artisan_ids:
                continue
            blood_score = 40 if donor["blood_group"] == recipient_blood else 25
            urgency = recipient.recipient_id.urgency_level
            if urgency >= 3:
                urgency_score = 25
            elif urgency == 2:
                urgency_score = 15
            else:
                urgency_score = 5
            days_waiting = (timezone.now() - recipient.recipient_id.created_at).days
            if days_waiting > 30:
                wait_score = 15
            elif days_waiting > 7:
                wait_score = 10
            else:
                wait_score = 5
            score = float(blood_score + urgency_score + wait_score + 5)

            matches.append({
                "match_id": f"jk-{donor['artisan_id']}",
                "donor": None,
                "donor_name": donor["name"],
                "recipient": recipient.recipient_id.patient_id,
                "recipient_name": recipient.recipient_id.name,
                "organ": recipient.recipient_id.organ_type,
                "blood_type": donor["blood_group"],
                "source": "jua-kali",
                "compatibility_score": score,
                "match_status": "PENDING",
                "match_date": None,
                "scheduled_date": None,
                "artisan_id": donor["artisan_id"],
                "phone": donor["phone"],
            })

        matches.sort(key=lambda item: item["compatibility_score"], reverse=True)
        return matches

    @staticmethod
    def calculate_weighted_score(donor: Donor, recipient: Recipient, donor_records):
        score = 0
        
        # 1. Blood Type Match (40 pts max)
        if donor.donor_id.blood_type == recipient.recipient_id.blood_type:
            score += 40
        else:
            score += 25 # Compatible but not exact
            
        # 2. Urgency Level (25 pts max)
        urgency = recipient.recipient_id.urgency_level
        if urgency >= 3: # High
            score += 25
        elif urgency == 2: # Medium
            score += 15
        else: # Low
            score += 5
            
        # 3. Medical Compatibility (20 pts max)
        # Check if they have specific HLA or Crossmatch data for a higher score
        has_hla = any(rec.record_type == 'HLA_TYPING' and rec.is_valid for rec in donor_records)
        has_crossmatch = any(rec.record_type == 'CROSSMATCH' and rec.is_valid for rec in donor_records)
        
        if has_hla and has_crossmatch:
            score += 20
        elif has_hla or has_crossmatch:
            score += 10
        else:
            score += 5
            
        # 4. Waiting Time (15 pts max)
        days_waiting = (timezone.now() - recipient.recipient_id.created_at).days
        if days_waiting > 30:
            score += 15
        elif days_waiting > 7:
            score += 10
        else:
            score += 5
            
        return float(score)
