from rest_framework import serializers
from .models import Match

class MatchSerializer(serializers.ModelSerializer):
    donor_name = serializers.CharField(source='donor.donor_id.name', read_only=True)
    recipient_name = serializers.CharField(source='recipient.recipient_id.name', read_only=True)
    organ = serializers.CharField(source='donor.donor_id.organ_type', read_only=True)
    blood_type = serializers.CharField(source='donor.donor_id.blood_type', read_only=True)
    phone = serializers.SerializerMethodField()
    artisan_id = serializers.SerializerMethodField()
    source = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = [
            'match_id', 'donor', 'donor_name', 'recipient', 'recipient_name',
            'organ', 'blood_type', 'source', 'compatibility_score',
            'match_status', 'match_date', 'scheduled_date',
            'phone', 'artisan_id',
        ]

    def get_source(self, obj):
        if obj.donor and '[Jua Kali Artisan:' in (getattr(obj.donor.donor_id, 'medical_history', '') or ''):
            return 'jua-kali'
        return 'hospital'

    def get_phone(self, obj):
        if obj.donor and getattr(obj.donor.donor_id, 'phone_number', None):
            return obj.donor.donor_id.phone_number
        return None

    def get_artisan_id(self, obj):
        if obj.donor and '[Jua Kali Artisan:' in (getattr(obj.donor.donor_id, 'medical_history', '') or ''):
            try:
                hist = obj.donor.donor_id.medical_history
                return hist.split('[Jua Kali Artisan:')[1].split(']')[0].strip()
            except Exception:
                return None
        return None
