//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function main() {
  try {
    await mongoose.connect(
      "mongodb+srv://admin-shivanshu:shivanshu-98@cluster0.duuterm.mongodb.net/todolistDB"
    );
    console.log("Connected to database server...");
  } catch (err) {
    console.log("Failed to connect tot the database: " + err);
  }
}
const itemsSchema = {
  name: {
    type: String,
  },
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to do list",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find()
    .then(function (items) {
      if (items.length === 0) {
        Item.insertMany(defaultItems);
        console.log("Saved items to DB.");
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        console.log(foundList);
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(function (result) {
        console.log(result);
      })
      .catch(function (err) {
        console.log(err);
      });

    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    )
      .then((foundList) => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (foundList != null) {
        // Show existing list
        res.render("list", {
          listTitle: customListName,
          newListItems: foundList.items,
        });
      } else {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      }
    })
    .catch((error) => {
      console.log("ERROR: ❌", error);
    });
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

main();