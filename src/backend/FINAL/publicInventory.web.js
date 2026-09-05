import { webMethod, Permissions } from "wix-web-module";
import {
  listPublicInventoryInternal,
  getPublicInventoryRecordInternal,
  getPublicDatedInventoryInternal,
  getDestinationFinderDataInternal,
  getHomeContentInternal
} from "backend/FINAL/publicInventory";

export const listPublicInventory=webMethod(Permissions.Anyone,async(input={})=>({ok:true,items:await listPublicInventoryInternal(input)}));
export const getPublicInventoryRecord=webMethod(Permissions.Anyone,async(input={})=>{
  const item=await getPublicInventoryRecordInternal(input);
  return item?{ok:true,item}:{ok:false,item:null,message:"Published inventory record not found."};
});
export const getPublicDatedInventory=webMethod(Permissions.Anyone,async(input={})=>({ok:true,items:await getPublicDatedInventoryInternal(input)}));
export const getPublicDestinationFinderData=webMethod(Permissions.Anyone,async(input={})=>({ok:true,...await getDestinationFinderDataInternal(input)}));
export const getPublicHomeInventory=webMethod(Permissions.Anyone,async(input={})=>({ok:true,...await getHomeContentInternal(input)}));
