var mysql = require('mysql');
var inquirer = require('inquirer');

// connect to the mysql database
var connection = mysql.createConnection({
  host: "localhost",
  port: 8889,
  user: "root",
  password: "root",
  database: "bamazon_db"
});

//tests connection
connection.connect(function(err){
  if(err){
    console.log(err);
    return;
  }
  console.log("connected as id " + connection.threadId);
  displayInventory();
});

// inquirer prompts
var productPurchasePrompt = {
  type:'input',
  message:"Which product would you like to purchase?",
  name:'product_purchase'
};
var productQuantityPrompt = {
  type:'input',
  message:"How many would you like to purchase?",
  name:'product_quantity'
};
var restartPrompt = {
  type: "list",
  message: "Shop again?",
  choices: ["Yes", "No"],
  name: "restart_prompt"
};

// displaying all inventory
var displayInventory = function(){
  connection.query("SELECT * FROM products", function(err,res){
    console.log("DISPLAYING ALL INVENTORY:" + "\n" + "----------------------------");
    for (var i = 0; i < res.length; i++) {
      console.log("Item ID: " + res[i].item_id + "\n" + "Product Name: " + res[i].product_name + "\n" + "Price: " + res[i].price + "\n" + "Available Quantity: " + res[i].stock_quantity + "\n----------------------------");
    }
    // prompting customer to enter product
    promptCustomer(res);
  })
}

var promptCustomer = function(res){
  inquirer.prompt([productPurchasePrompt]).then(function(inquirerResponse){
    var chosenProductID = parseInt(inquirerResponse.product_purchase);
    for (var i=0;i<res.length;i++){
      if(res[i].item_id === chosenProductID){
        var id = i;
        // prompt amount to purchase
        inquirer.prompt([productQuantityPrompt]).then(function(inquirerResponse){
          var chosenQuantity = parseInt(inquirerResponse.product_quantity);

          // if number is less than or equal to the current inventory
          if ((res[id].stock_quantity - chosenQuantity) >= 0) {
            var newQuantity = res[id].stock_quantity - chosenQuantity;
            //total cost
            var totalCost = res[id].price * chosenQuantity;
            // update value in database with newQuantity
            var sql = "UPDATE ?? SET ?? = ? WHERE ?? = ?";
            var values = ['products', 'stock_quantity', newQuantity, 'item_id', chosenProductID];
            connection.query(sql, values, function(err, res){
              if(err){
                console.log(err);
                connection.end();
              }
              // alert user with total cost of transaction and product purchased
              console.log("Congratulations! Products purchased" + "\n" + "Total Cost: $" + totalCost);
              // ask user if they want to shop again
              inquirer.prompt([restartPrompt]).then(function(inquirerResponse){
                if (inquirerResponse.restart_prompt === "Yes") {
                  displayInventory();
                } else {
                  console.log("Thank You!");
                  connection.end();
                }
              })
            })
          }
          // if the number is greater than the product's stock_quantity amount, alert the user & restart the promptCustomer function
          else {
            console.log("Sorry, insufficient Quantity! Please try to order less of this product");
            promptCustomer(res);
          }
        })
      }
    }
  })
}