const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')

let username = "";
let password = "";
let token = "";

USE_LOCAL_ENDPOINT = true;
// set this flag to true if you want to use a local endpointyy
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = ""
if (USE_LOCAL_ENDPOINT) {
  ENDPOINT_URL = "http://127.0.0.1:5000"
} else {
  ENDPOINT_URL = "https://mysqlcs639.cs.wisc.edu"
}



async function getToken() {
  let request = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + base64.encode(username + ':' + password)
    },
    redirect: 'follow'
  }

  const serverReturn = await fetch(ENDPOINT_URL + '/login', request)
  const serverResponse = await serverReturn.json()
  console.log(serverResponse.message)
  token = serverResponse.token
  console.log("The message which comes from the server is" + serverResponse.message);
  return serverResponse;
}


async function message(msg, bool) {
  let today = new Date()


  let request = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "x-access-token": token
    },
    redirect: 'follow',
    body: JSON.stringify({
      date: today.toISOString(),
      isUser: bool,
      text: msg,
    })
  }
  let response = await fetch(ENDPOINT_URL + '/application/messages', request);
  let x = await response.json()
  // console.log(x)
}
async function clearmessage() {
  let request = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      "x-access-token": token
    },
    redirect: 'follow'
  }
  let response = await fetch(ENDPOINT_URL + '/application/messages', request);
  let x = await response.json()
  return x;
}

app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function welcome() {
    agent.add('Hi How can I help you today')
  }
  async function login() {
    // agent.add("hi")
    username = agent.parameters.username;
    password = agent.parameters.password;
    let sresponse = await getToken();
    console.log("the value of the message here is" + sresponse.message);
    console.log()

    if (sresponse.message == undefined) {
      await clearmessage();
      agent.add('Login was Sucessfull')
      agent.add(` ${username} welcome to wiscshop How may I help you`)
      await message(`Login was Sucessfull`, false)
      await message(` ${username} welcome to wiscshop How may I help you`, false)
    }
    else {
      await clearmessage();
      agent.add('It seems as if your username and password are incorrect')
      await message(`we do not seem to have you registered as a user please try signing up first`, false)
    }


  }
  async function getcategory() {
    let request = {
      method: 'GET'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/categories', request)
    const serverResponse = await serverReturn.json()
    console.log("the get category function is executed")
    return serverResponse;
  }
  async function category() {
    console.log("the category inquiry function is executed")
    await message(agent.query,true)
    if (token == undefined) {
      console.log("pleas login you dont seemed to be logged in")
      await message(`please login you do not seemed to be in login`, false)
    }
    let serverresponse = await getcategory()
    console.log("the items we have are" + serverresponse.categories);
    agent.add("the categories we have are" + serverresponse.categories);
    await message(`The categories we have are${serverresponse.categories}`, false)
  }
  async function gettags() {
    let request = {
      method: 'GET'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/categories/' + agent.parameters.category + '/tags', request)
    const serverResponse = await serverReturn.json()



    return serverResponse;

  }
  async function Taginquiry() {
    await message(agent.query,true)
    let serverResponse = await gettags()
    console.log("the get category function is executed")
    agent.add('the tags are' + serverResponse.tags)
    await message(`The tag we have in the category are ${serverResponse.tags}`, false)
  }
  async function getCart() {
    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      redirect: 'follow'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/application/products', request)
    const serverResponse = await serverReturn.json()

    return serverResponse;
  }
  async function cartinfo() {
    if (token == "") {
      agent.add('it seems like you have logged in for too long please try logggin in again')
    }
    else {
      await message(agent.query,true)
      agent.add('here is what you have in your cart')
      let serverResponse = await getCart();
      let pa = [];
      console.log(serverResponse.products);
      pa = serverResponse.products;
      var j = 0;
      var cost = 0;
      var count = 0;
      let cat = [];
      for (j = 0; j < pa.length; j++) {
        count = count + pa[j].count;
        cost = cost + pa[j].count * pa[j].price;
        console.log("The category is")
        if (cat.includes(pa[j].category) == false) {
          console.log("this is the category block");
          console.log("the contents of the cart are" + pa[j].category);
          cat.push(pa[j].category);
        }

      }
      agent.add("the total count of the products in the cart is" + cost);
      agent.add("the toatal amount to be checked out from the cart is" + count);
      agent.add("The categories of the products in the cart are" + cat);
      await message(`the total count of the products in the cart is ${count}`, false)
      await message(` the toatal amount to be checked out from the cart is${cost}`, false)
      await message(`The categories of the products in the cart are ${cat}`, false)
    }

  }
  async function getproductid(product) {
    var pname = product;
    console.log("The name of the product is" + pname);
    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/products', request)
    const serverResponse = await serverReturn.json()
    var pid;
    var pr = [];
    var i = 0;
    let res = 'none';
    pr = serverResponse.products;
    for (i = 0; i < pr.length; i++) {
      if (pr[i].name == pname) {
        pid = pr[i].id;
        console.log("this has been executed with pid" + pid)
        return pid;

      }


    }


    return res;

  }
  async function getproductinfo(pid) {
    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/products/' + pid, request)
    const serverResponse = await serverReturn.json()


    return serverResponse;


  }
  async function getproductreview(pid) {

    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/products/' + pid + '/reviews', request)
    const serverResponse = await serverReturn.json()


    return serverResponse;


  }
  async function productinfo() {
    if (token == "") {
      agent.add('it seems like you have logged in for too long please try logggin in again')
    }
    else {
     
      await message(agent.query,true)
      let pid = await getproductid(agent.parameters.product);
      if (pid == 'none') {
        agent.add("sorry we do not seem to have your product please specify the name");
        await message(`sorry we do not seem to have your product please specify the name`, false)
      }
      else {
        let serresponse = await getproductinfo(pid);
        agent.add("the name of the product is" + serresponse.name);
        agent.add("the cost of the product is" + serresponse.price);
        agent.add("the description of the product is" + serresponse.description);
        agent.add("the category to whcih the rpoduct belongs to is" + serresponse.category);
        await message(`the name of the product is ${serresponse.name}`, false)
        await message(`the cost of the product is ${serresponse.price}`, false)
        await message(` the description of the product is${serresponse.description}`, false)
        await message(` the category to which the rpoduct belongs to is${serresponse.category}`, false)
        let quer = agent.query
        let sstring = "review"
        let info = "more info"
        if (quer != null) {
          if (quer.includes(sstring) || quer.includes(info)) {
            let response = await getproductreview(pid);
            let rev = [];
            let tex = [];
            rev = response.reviews;
            let k = 0;
            let astar = 0;
            for (k = 0; k < rev.length; k++) {
              astar = astar + rev[k].stars;
              tex[k] = rev[k].text;

            }
            astar = (astar / rev.length);
            agent.add("the average rating for the product you have requested is" + astar);
            agent.add("the reviews for the product are as follows" + tex);
            await message(`the average rating for the product you have requested is ${astar}`, false)
            await message(`the reviews for the product are as follows${tex}`, false)
          }
          else {
            agent.add("'if you are looking for reviews please specify the product and the tag reviews if you did but couldnt still find it we may not have reviews")
            await message('if you are looking for reviews please specify the product and the tag reviews if you did but couldnt still find it we may not have reviews', false)
          }
        }
      }

    }





  }
  async function addTags() {
    if (token == " ") {
      agent.add('it seems like you have logged in for too long please try logggin in again')
    }
    else {
      await message(agent.query,true)
      let tag = agent.parameters.tag;

      let request = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        redirect: 'follow'
      }

      const serverReturn = await fetch(ENDPOINT_URL + '/application/tags/' + tag, request)
      const serverResponse = await serverReturn.json()
      if (serverResponse.message == "Tag added to application state!") {
        agent.add('the tag has been added sucessfully')
        await message('the tag has been added sucessfully', false)
      }
      else {
        agent.add('the tag could not be added')
        await message('the tag coudl not be added', false)
      }
    }

  }
  async function removetags() {
    if (token == " ") {
      agent.add('it seems like you have logged in for too long please try logggin in again')
    }
    else {
      await message(agent.query,true)
      let tag = agent.parameters.tag;


      const serverReturnget = await fetch(ENDPOINT_URL + '/application/tags/' ,{
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        redirect: 'follow'
      })
      const serverResponseget = await serverReturnget.json()
      let arr = []
      arr= serverResponseget.tags

      if(!arr.includes(tag)){
        return agent.add("tag not in the filter!")

      }

      let request = {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        redirect: 'follow'
      }

      const serverReturn = await fetch(ENDPOINT_URL + '/application/tags/' + tag, request)
      const serverResponse = await serverReturn.json()
      console.log(serverResponse)
     
      if (serverResponse.message == "Tag removed from application state!") {
        agent.add('the tag has been deleted sucessfully')
        await message('the tag has been deleted sucessfully', false)
      }
      else {
        agent.add('the tag could not be deleted')
        await message('the tag coudl not be deleted', false)
      }
    }
  }
  async function addtocart()
  {
    if(token=="")
    {
      agent.add('it seems like you have logged in for too long please try logggin in again')
    }

   else{ 
    await message(agent.query,true)
     let pname=agent.parameters.product
     let pid= await getproductid(pname)
    let request = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      redirect: 'follow'
    }

    const serverReturn = await fetch(ENDPOINT_URL + '/application/products/' + pid, request)
    const serverResponse = await serverReturn.json()
    if(serverResponse.message=="Product added to cart!")
    {
      agent.add("the product was sucessfully added to the cart")
      await message('the product was  sucessfully added to the cart',false)

    }

   }
}
async function removefromcart()
{
  if(token=="")
  {
    agent.add('it seems like you have logged in for too long please try logggin in again')
  }

 else{ 
  await message(agent.query,true)
   let pname=agent.parameters.product
   let pid= await getproductid(pname)
  let request = {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': token
    },
    redirect: 'follow'
  }

  const serverReturn = await fetch(ENDPOINT_URL + '/application/products/' + pid, request)
  const serverResponse = await serverReturn.json()
  if(serverResponse.message=="Product removed from cart!")
  {
    agent.add("the product was sucessfully removed from the cart")
    await message('the product was  sucessfully removed from the cart',false)

  }
  else if(serverResponse.message=="Product not found!")
  {
    agent.add("The product is already delted please dont try to delete futher")
    await message('The product is already delted please dont try to delete futher',false)
  }

 }
 





}
async function emptycart()
{
  if(token=="")
  {
    agent.add('it seems like you have logged in for too long please try logggin in again')
  }
  else
  {await message(agent.query,true)
    let request = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      redirect: 'follow'
    }
  
    const serverReturn = await fetch(ENDPOINT_URL + '/application/products', request)
    const serverResponse = await serverReturn.json()
    if(serverResponse.message=="Cart cleared!")
          {agent.add("the cart was cleared")
           await message('the cart has been cleared',false)
          }
          else
          {
            agent.add("the cart could not be cleared")
            await message('the cart could not be cleared',false) 
          }



  }




}
async function cartreview()
{
  if(token=="")
  {
    agent.add('it seems like you have logged in for too long please try logggin in again')
  }
  else
  {await message(agent.query,true)
    let request = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      redirect: 'follow',
      body: JSON.stringify({
        back: false,
        dialogflowUpdated: true,
        page: '/'+username+'/cart'
      })
    }
  
    const serverReturn = await fetch(ENDPOINT_URL + '/application', request)
    const serverResponse = await serverReturn.json()
    if(serverResponse.message=="Application state modified!")
    {
      agent.add("please review your cart")
      await message('please review your cart',false)
    }
    else
    {
      agent.add("there seems to have been an error")
      await message('there seems to have been an error',false)
    }

}}
async function confirmcart()
{
  if(token=="")
  {
    agent.add('it seems like you have logged in for too long please try logggin in again')
  }
  else
  {
    await message(agent.query,true)
    let request = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      redirect: 'follow',
      body: JSON.stringify({
        back: false,
        dialogflowUpdated: true,
        page: '/'+username+'/cart-confirmed'
      })
     }
     const serverReturn = await fetch(ENDPOINT_URL + '/application' , request)
     const serverResponse = await serverReturn.json()
     if(serverResponse.message=="Application state modified!")
     {
       agent.add("You have confirmed your order")
       await message('you have confirmed your order',false)
     }
     else
     {
       agent.add("there seems to have been an error")
       await message('there seems to have been an error',false)
     }





  }




}
async function prevpage()
{ if(token=="")
  {
    agent.add('it seems like you have logged in for too long please try logggin in again')
  }
  else
  {await message(agent.query,true)
    let request = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      redirect: 'follow',
      body: JSON.stringify({
        back: true
      })
     }
     const serverReturn = await fetch(ENDPOINT_URL + '/application' , request)
     const serverResponse = await serverReturn.json()
     if (serverResponse.message == "Application state modified!") {
      agent.add(` You have been sucessfully navigated to the previous page`)
      await message(` You have been sucessfully navigated to the previous page`,false)
    

    }
    else
    { agent.add(`There seems to have been an error`)
      await message(` There seems to have been an error`,false)
     }






}
}
async function homepagenavigation()
{
  if(token=="")
  {
    agent.add('it seems like you have logged in for too long please try logggin in again')
  }
  else
  {
    await message(agent.query,true)
    let request = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      redirect: 'follow',
      body: JSON.stringify({
        back: false,
        dialogflowUpdated: true,
        page: '/'+username
      })
     }
     const serverReturn = await fetch(ENDPOINT_URL + '/application' , request)
     const serverResponse = await serverReturn.json()
     if (serverResponse.message == "Application state modified!") {
      agent.add(` You have been sucessfully navigated to the HOME page`)
      await message(` You have been sucessfully navigated to the HOME page`,false)
    

    }
    else
    { agent.add(`There seems to have been an error`)
      await message(` There seems to have been an error`,false)
     }



}}
async function categorynavigation()
{
  if(token=="")
  {
    agent.add('it seems like you have logged in for too long please try logggin in again')
  }
  else
  {
    await message(agent.query,true)
    let request = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token
      },
      redirect: 'follow',
      body: JSON.stringify({
        back: false,
        dialogflowUpdated: true,
        page:  '/'+username+'/'+agent.parameters.category
      })
     }
     const serverReturn = await fetch(ENDPOINT_URL + '/application' , request)
     const serverResponse = await serverReturn.json()
     if (serverResponse.message == "Application state modified!") {
      agent.add(` You have been sucessfully navigated to the  page`+agent.parameters.category)
      await message(` You have been sucessfully navigated to the page${agent.parameters.category}`,false)
    

    }
    else
    { agent.add(`There seems to have been an error`)
      await message(` There seems to have been an error`,false)
     }









}}

  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  intentMap.set('Login', login)
  intentMap.set('CategoryInquiry', category)
  intentMap.set('Taginquiry', Taginquiry)
  intentMap.set('Cartinfo', cartinfo)
  intentMap.set('Productinquiry', productinfo)
  intentMap.set('AddTags', addTags)
  intentMap.set('RemoveTags', removetags)
  intentMap.set('AddToCart', addtocart)
  intentMap.set('RemoveFromCart',removefromcart)
  intentMap.set('EmptyCart', emptycart)
   intentMap.set('CartReview', cartreview)
   intentMap.set('ConfirmCart', confirmcart)
   intentMap.set('PreviousPage', prevpage)
   intentMap.set('HomepageNavigation',  homepagenavigation)
   intentMap.set('CategoryNavigation', categorynavigation)
  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)
