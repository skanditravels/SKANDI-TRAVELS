// backend/careersService.web.js
import { webMethod, Permissions } from "wix-web-module";
import wixData from "wix-data";

const OPTS={suppressAuth:true};
const POSITIONS="CareerPositions";
const APPLICATIONS="CareerApplications";
const ACCESS_CODES="CareerApplicantAccessCodes";
const SESSIONS="CareerApplicantSessions";

function clean(v,max=1000){return String(v??"").trim().slice(0,max)}
function email(v){return clean(v,254).toLowerCase()}
function uid(prefix){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}
function now(){return new Date()}

export const getPublicCareerData = webMethod(
  Permissions.Anyone,
  async () => {
    const result=await wixData.query(POSITIONS)
      .ne("active",false)
      .ne("published",false)
      .descending("_createdDate")
      .limit(500)
      .find(OPTS)
      .catch(()=>({items:[]}));

    return {ok:true,positions:result.items||[]};
  }
);

export const submitCareerApplication = webMethod(
  Permissions.Anyone,
  async ({application={}}={}) => {
    const applicantEmail=email(application.email);
    if(!applicantEmail) throw new Error("Applicant email is required.");

    const row={
      ...application,
      email:applicantEmail,
      applicationId:clean(application.applicationId,100)||uid("APP"),
      status:clean(application.status,60)||"SUBMITTED",
      createdAt:now(),
      updatedAt:now()
    };

    const saved=await wixData.insert(APPLICATIONS,row,OPTS);
    return {ok:true,applicationId:saved.applicationId||saved._id,status:saved.status};
  }
);

export const requestApplicantPortalCode = webMethod(
  Permissions.Anyone,
  async ({email:rawEmail=""}={}) => {
    const applicantEmail=email(rawEmail);
    if(!applicantEmail) throw new Error("Email is required.");

    // The actual email dispatcher may replace this token delivery workflow.
    const code=String(Math.floor(100000+Math.random()*900000));
    const expiresAt=new Date(Date.now()+15*60*1000);

    await wixData.insert(ACCESS_CODES,{
      title:applicantEmail,
      email:applicantEmail,
      code,
      expiresAt,
      used:false,
      createdAt:now()
    },OPTS);

    return {
      ok:true,
      requested:true,
      expiresAt:expiresAt.toISOString(),
      // Never return the code to production UI.
      delivery:"QUEUED"
    };
  }
);

export const verifyApplicantPortalCode = webMethod(
  Permissions.Anyone,
  async ({email:rawEmail="",code=""}={}) => {
    const applicantEmail=email(rawEmail);
    const value=clean(code,20);
    if(!applicantEmail||!value) throw new Error("Email and code are required.");

    const found=await wixData.query(ACCESS_CODES)
      .eq("email",applicantEmail)
      .eq("code",value)
      .eq("used",false)
      .descending("_createdDate")
      .limit(1)
      .find(OPTS);

    const row=found.items?.[0];
    if(!row||!row.expiresAt||new Date(row.expiresAt).getTime()<Date.now()){
      return {ok:false,verified:false};
    }

    row.used=true;
    await wixData.update(ACCESS_CODES,row,OPTS);

    const token=uid("CAREER-SESSION");
    const expiresAt=new Date(Date.now()+60*60*1000);
    await wixData.insert(SESSIONS,{
      title:applicantEmail,
      email:applicantEmail,
      token,
      expiresAt,
      active:true,
      createdAt:now()
    },OPTS);

    return {ok:true,verified:true,token,expiresAt:expiresAt.toISOString()};
  }
);

export const getApplicantPortalData = webMethod(
  Permissions.Anyone,
  async ({token=""}={}) => {
    const value=clean(token,160);
    if(!value) throw new Error("Applicant session is required.");

    const found=await wixData.query(SESSIONS)
      .eq("token",value)
      .eq("active",true)
      .limit(1)
      .find(OPTS);

    const session=found.items?.[0];
    if(!session||!session.expiresAt||new Date(session.expiresAt).getTime()<Date.now()){
      return {ok:false,authorized:false};
    }

    const applications=await wixData.query(APPLICATIONS)
      .eq("email",session.email)
      .descending("_createdDate")
      .limit(100)
      .find(OPTS)
      .catch(()=>({items:[]}));

    return {ok:true,authorized:true,email:session.email,applications:applications.items||[]};
  }
);
