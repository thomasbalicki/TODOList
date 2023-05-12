//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose
  .connect("mongodb+srv://thomabalic:Test123@cluster0.8tnncgu.mongodb.net/todolistDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`DB Connection Success`))
  .catch((err) => {
    console.log(`DB Connection Failed`)
    console.log(err.message);
  });

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Practice coding"
});

const item2 = new Item({
  name: "Practice more coding"
});

const item3 = new Item({
  name: "consider sleeping"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

  Item.find({})
    .then(foundItems => {
      if (foundItems.length === 0) {
        return Item.insertMany(defaultItems);
      } else {
        return Promise.resolve(foundItems);
      }
    })
    .then(items => {
      res.render("list", { listTitle: "Today", newListItems: items });
    })
    .catch(err => {
      console.log(err);
    });


});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName })
    .then((foundList) => {
      if (!foundList) {
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //show existing list
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items })
      };
    })
    .catch(err => {
      console.log(err);
    });

});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list; // corrected variable name

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save()
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        // Handle the error
      });
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.items.push(item);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        // Handle the error
      });
  }
});


app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({ _id: checkedItemId })
      .then(() => {
        console.log("Item deleted.");
      })
      .catch(err => {
        console.log(err);
      });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
      .then((foundList) => {
        res.redirect("/" + listName);
      })
      .catch((err) => {
        // Handle the error
      });

  }


  res.redirect("/");
});


app.get("/about", function (req, res) {
  res.render("about");
});




app.listen(3000, function () {
  console.log("Server started on port 3000");
});
