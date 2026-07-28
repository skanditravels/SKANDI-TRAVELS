//Read Our Wix Router API here http://wix.to/94BuAAs/

import {ok, notFound, WixRouterSitemapEntry} from "wix-router";
    
// SAMPLE DATA
const peopleData = {
  "Ash": {
    title: "Ash Stowe",
    image: "https://static.wixstatic.com/media/b8f383e0fe2b478ea91362b707ef267b.jpg"
  },
  "Aiden": {
    title: "Aiden Johnson",
    image: "https://static.wixstatic.com/media/ca3c7ac5427e43928aa5f3f443ae2163.jpg"
  },
  "Jess": {
    title: "Jess White",
    image: "https://static.wixstatic.com/media/147fe6f37fe24e83977b4124e41b6d3d.jpg"
  },
  "Morgan": {
    title: "Morgan James",
    image: "https://static.wixstatic.com/media/59e1f2f4dbbc4f7c9d6e66e3e125d830.jpg"
  }
};

export function newRouter2_Router(request) {

// Get item name from URL request
const name = request.path[0];

// Get the item data by name
const data = peopleData[name];

if (data) {
  // Define SEO tags
  const seoData = {
  title: data.title,
  description: "This is a description of " + data.title + " page",
  noIndex: false,
  metaTags: [
  {
    "property": "og:title",
    "content": data.title
  },
  {
    "property": "og:image",
    "content": data.image
  }
  ]
};

  // Render item page
  return ok("newRouter-page", data, seoData);
}

  // Return 404 if item is not found
  return notFound();
}

export function newRouter2_SiteMap(sitemapRequest) {
  // Convert the data to site map entries
  const siteMapEntries = Object.keys(peopleData).map((name)=>{
  const data= peopleData[name];
  const entry = new WixRouterSitemapEntry(name);
  entry.pageName = "newRouter-page"; // The name of the page in the Wix editor to render
  entry.url = "/newRouter/" + name ; // Relative URL of the page
  entry.title = data.title; // For better SEO - Help Google
  return entry;
  });

  // Return the site map entries
  return siteMapEntries;
}
