from django.test import SimpleTestCase, TestCase
from unittest.mock import patch

from matching.artisan_client import to_blood_group
from matching.services import OrganMatchingService
from hospitals.models import Hospital
from patients.models import Patient, Recipient


class BloodGroupMappingTests(SimpleTestCase):
    def test_maps_positive_and_negative(self):
        self.assertEqual(to_blood_group("A", "positive"), "A+")
        self.assertEqual(to_blood_group("O", "negative"), "O-")
        self.assertIsNone(to_blood_group("A", None))
        self.assertIsNone(to_blood_group(None, "positive"))


class ProducerMatchTests(TestCase):
    def setUp(self):
        hospital = Hospital.objects.create(name="St. Jude Hospital", location="City Center")
        patient = Patient.objects.create(
            hospital=hospital,
            name="Test Recipient",
            blood_type="A+",
            organ_type="KIDNEY",
            medical_history="Needs kidney",
            urgency_level=3,
        )
        self.recipient = Recipient.objects.create(
            recipient_id=patient,
            waiting_list_status="ACTIVE",
        )

    @patch("matching.services.fetch_artisan_donors")
    def test_includes_only_blood_compatible_artisans(self, mock_fetch):
        mock_fetch.return_value = [
            {"artisan_id": "u-artisan", "name": "Faith", "phone": "+254", "blood_group": "O-", "source": "jua-kali"},
            {"artisan_id": "u-a3", "name": "Mercy", "phone": "+254", "blood_group": "B+", "source": "jua-kali"},
        ]

        matches = OrganMatchingService.get_producer_matches(self.recipient)
        ids = [m["artisan_id"] for m in matches]

        self.assertEqual(ids, ["u-artisan"])
        self.assertEqual(matches[0]["source"], "jua-kali")
        self.assertEqual(matches[0]["blood_type"], "O-")
        self.assertEqual(matches[0]["match_id"], "jk-u-artisan")


class ArtisanMatchApprovalAPITests(TestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model
        from rest_framework.test import APIClient
        from matching.models import Match

        User = get_user_model()
        self.client = APIClient()
        self.hospital = Hospital.objects.create(name="St. Jude Hospital", location="City Center")
        self.user = User.objects.create_user(
            email="coordinator@stjude.com",
            password="pass",
            role="COORDINATOR",
            hospital=self.hospital
        )
        self.client.force_authenticate(user=self.user)

        self.patient = Patient.objects.create(
            hospital=self.hospital,
            name="Alice Recipient",
            blood_type="O+",
            organ_type="KIDNEY",
            medical_history="Kidney failure",
            urgency_level=3,
        )
        self.recipient = Recipient.objects.create(
            recipient_id=self.patient,
            waiting_list_status="ACTIVE",
        )

    @patch("matching.views.OrganMatchingService.get_producer_matches")
    @patch("matching.views.fetch_artisan_donors")
    def test_approve_artisan_match(self, mock_fetch, mock_matches):
        mock_fetch.return_value = [{
            "artisan_id": "u-demo-a5",
            "name": "David Mutua",
            "phone": "+254 722 100 015",
            "blood_group": "O+",
            "source": "jua-kali"
        }]

        url = "/api/v1/matching/jk-u-demo-a5/"
        payload = {
            "match_status": "APPROVED",
            "scheduled_date": "2026-11-02T10:00:00Z",
            "recipient": self.patient.patient_id,
            "artisan_id": "u-demo-a5",
            "donor_name": "David Mutua",
            "phone": "+254 722 100 015",
            "blood_type": "O+",
            "compatibility_score": 85.0
        }

        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["match_status"], "APPROVED")
        self.assertEqual(response.data["source"], "jua-kali")

        # Verify DB records
        from matching.models import Match
        from patients.models import Patient as PModel
        match = Match.objects.filter(recipient=self.recipient).first()
        self.assertIsNotNone(match)
        self.assertEqual(match.match_status, "APPROVED")
        self.assertEqual(match.donor.donor_id.name, "David Mutua")
        self.assertIn("[Jua Kali Artisan: u-demo-a5]", match.donor.donor_id.medical_history)

        self.recipient.refresh_from_db()
        self.assertEqual(self.recipient.waiting_list_status, "MATCHED")

    def test_reject_artisan_match(self):
        url = "/api/v1/matching/jk-u-demo-a5/"
        payload = {
            "match_status": "REJECTED"
        }
        response = self.client.patch(url, payload, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["match_status"], "REJECTED")
