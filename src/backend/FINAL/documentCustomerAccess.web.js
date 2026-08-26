import { webMethod, Permissions } from "wix-web-module";
import {
  listPublicDefinitionsCore,
  documentAccessSupabase
} from "backend/FINAL/documentAccessCore";

export const listPublicDocumentForms = webMethod(
  Permissions.Anyone,
  async () => {
    const definitions=await listPublicDefinitionsCore();
    return {
      ok:true,
      documents:definitions.map(d=>({
        code:d.code,
        title:d.name,
        category:d.category,
        allowBlankFill:!!d.allow_blank_fill,
        allowBlankDownload:!!d.allow_blank_download,
        officialSourceUrl:d.official_source_url||"",
        sensitivityClass:d.sensitivity_class||"STANDARD"
      }))
    };
  }
);

export const redeemDocumentAccessCode = webMethod(
  Permissions.Anyone,
  async ({email,accessCode}={}) => {
    const rows=await documentAccessSupabase("rpc/skandi_redeem_document_access_code",{
      method:"post",
      body:{p_email:String(email||"").trim(),p_access_code:String(accessCode||"").trim().toUpperCase()}
    });
    const redemption=Array.isArray(rows)?rows[0]:rows;
    if(!redemption?.packet_id)return {ok:false,error:"The access code is invalid, expired, or locked."};

    const items=await documentAccessSupabase(
      `document_access_packet_items?packet_id=eq.${encodeURIComponent(redemption.packet_id)}&order=sort_order.asc`
    );
    const ids=(Array.isArray(items)?items:[]).map(x=>x.document_id);
    const documents=[];
    for(const id of ids){
      const d=await documentAccessSupabase(`document_instances?id=eq.${encodeURIComponent(id)}&limit=1`);
      const instance=Array.isArray(d)?d[0]:null;
      if(!instance)continue;
      const defs=await documentAccessSupabase(
        `document_definitions?code=eq.${encodeURIComponent(instance.document_code)}&limit=1`
      );
      const definition=Array.isArray(defs)?defs[0]:null;
      documents.push({
        documentId:instance.id,
        title:definition?.name||instance.document_code,
        documentType:instance.document_code,
        status:instance.status,
        instance,
        definition
      });
    }
    return {
      ok:true,
      packet:{
        packetId:redemption.packet_id,
        packetNumber:redemption.packet_number,
        bookingReference:redemption.booking_reference,
        title:"SKANDI Travel Documents",
        instructions:"Review and complete the documents assigned to your trip.",
        documents
      }
    };
  }
);
