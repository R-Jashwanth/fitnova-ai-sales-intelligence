from backend.repositories.base import CRUDBase
from backend.models.models import Organization, Team, Advisor, Call, IssueTag, Appeal
from backend.schemas.schemas import (
    OrganizationCreate, OrganizationBase,
    TeamCreate, TeamBase,
    AdvisorCreate, AdvisorBase,
    CallCreate, CallBase,
    IssueTagCreate, IssueTagBase,
    AppealCreate, AppealBase
)

class CRUDOrganization(CRUDBase[Organization, OrganizationCreate, OrganizationBase]):
    pass

class CRUDTeam(CRUDBase[Team, TeamCreate, TeamBase]):
    pass

class CRUDAdvisor(CRUDBase[Advisor, AdvisorCreate, AdvisorBase]):
    pass

class CRUDCall(CRUDBase[Call, CallCreate, CallBase]):
    pass

class CRUDIssueTag(CRUDBase[IssueTag, IssueTagCreate, IssueTagBase]):
    pass

class CRUDAppeal(CRUDBase[Appeal, AppealCreate, AppealBase]):
    pass

organization = CRUDOrganization(Organization)
team = CRUDTeam(Team)
advisor = CRUDAdvisor(Advisor)
call = CRUDCall(Call)
issue_tag = CRUDIssueTag(IssueTag)
appeal = CRUDAppeal(Appeal)
