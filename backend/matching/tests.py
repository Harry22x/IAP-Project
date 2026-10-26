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
