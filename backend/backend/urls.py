from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import UserViewSet, RegisterView, MeView
from hospitals.views import HospitalViewSet
from patients.views import PatientViewSet, DonorViewSet, RecipientViewSet, UnifiedPatientViewSet
from medical_records.views import MedicalRecordViewSet
from matching.views import MatchViewSet
from interoperability.views import ExternalExchangeLogViewSet
from reports.views import SystemReportViewSet, TCStatsView

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='users')
router.register(r'hospitals', HospitalViewSet, basename='hospitals')
router.register(r'patients', PatientViewSet, basename='patients')
router.register(r'unified-patients', UnifiedPatientViewSet, basename='unified-patients')
router.register(r'donors', DonorViewSet, basename='donors')
router.register(r'recipients', RecipientViewSet, basename='recipients')
router.register(r'medical-records', MedicalRecordViewSet, basename='medical-records')
router.register(r'matching', MatchViewSet, basename='matching')
router.register(r'exchanges', ExternalExchangeLogViewSet, basename='exchanges')
router.register(r'reports', SystemReportViewSet, basename='reports')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/v1/auth/register/', RegisterView.as_view(), name='register'),
    path('api/v1/auth/me/', MeView.as_view(), name='me'),
    path('api/v1/tc/stats/', TCStatsView.as_view(), name='tc-stats'),
    path('api/v1/', include(router.urls)),
]
