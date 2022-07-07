//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-deus:test123@cluster0.vebgjmu.mongodb.net/todolistDB");

const itemSchema = {
  name: String
};

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
})

const item2 = new Item({
  name: "Hit the + button to add a new item."
})

const item3 = new Item({
  name: "<-- Hit this to delete an item."
})

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  const day = date.getDate();

  Item.find({}, (err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully added default items.");
        }
      })
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: items });
    }
  })

});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        })
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
      }
    }
  })

})

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item({
    name: itemName
  });

  if (listName === date.getDate()) {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
})

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === date.getDate()) {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        res.redirect("/");
      }
    })
  } else {
    List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : checkedItemId}}}, (err, foundList)=>{
      if(!err){
        res.redirect("/"+listName);
      }
    })
  }
})

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}

app.listen(port, function () {
  console.log("Server started on port 3000");
});
