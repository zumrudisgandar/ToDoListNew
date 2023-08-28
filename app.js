//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-zumrud:Test123@cluster0.f14wlq0.mongodb.net/todolistDB", { useNewUrlParser: true })

const ItemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", ItemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listsSchema = {
    name: String,
    items: [ItemsSchema]
};

const List = mongoose.model("List", listsSchema);

app.get("/", async function(req, res) {
    try {
        const foundItems = await Item.find({});
        if (foundItems.length === 0) {
            Item.insertMany(defaultItems)
                .then(function() {
                    console.log("Successfully saved all the items to itemsDB");
                })
                .catch(function(err) {
                    console.log(err);
                });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    } catch (err) {
        console.log(err);
    }
});


app.post("/", async function(req, res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        try {
            const foundList = await List.findOne({ name: listName });
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        } catch (err) {
            console.log(err);
        }
    }
});

app.post("/delete", function(req, res) {
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === "Today") {
        Item.findByIdAndRemove({ _id: checkedItemID })
            .then(() => {
                console.log("Successfully deleted the item.");
            })

        .catch((err) => {
            console.log(err);
        });

        res.redirect("/");
    } else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemID } } })
            .then(() => {
                res.redirect("/" + listName);
            })

        .catch((err) => {
            console.log(err);
        });
    }


});

app.get("/:customListName", async function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    try {
        const foundList = await List.findOne({ name: customListName });
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
    } catch (err) {
        console.log(err);
    }
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
});