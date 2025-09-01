import wishList from "../models/wishList.js";
import axios from "axios";

const add_product = async (req, res) => {
  const wishListBody = req.body;
  try {

    const elementExisting = await wishList.findOne({userId : wishListBody.userId});

    if(elementExisting){
        const newPid = wishListBody.items[0].productId;

        // check if it already exists in elementExisting.items:
        const alreadyInList = elementExisting.items
            .some(item => item.productId === newPid);

        if (alreadyInList) {
            return res
                .status(200)
                .json({ msg: `${wishListBody.userId} already has that product in wishlist` });
        }
        elementExisting.items.push(...wishListBody.items);
        elementExisting.updatedAt = new Date(),
        await elementExisting.save();
        return res
      .status(200)
      .json({ msg: `new product add to cart : ${wishListBody.userId} succesfully` });
    }

    wishListBody.updatedAt = new Date();
    const newElement = new wishList(wishListBody);
    await newElement.save();

    console.log(`new product add to wishList : ${wishListBody.userId} succesfully`);    
    return res
      .status(200)
      .json({ msg: `new product add to wishList : ${wishListBody.userId} succesfully` });
  } catch (error) {
      console.log(error);
    res.status(500).json({ message: "Failed to add item", error: error.message })
  }
};

const getWishlist = async (req, res) => {
  const userId = req.params.userId;

  try {
    const selectedWishList = await wishList.findOne({ userId : userId});
    if (!selectedWishList) {
      return res
        .status(404)
        .json({ msg: `No wishList found for user: ${userId}` });
    }

    // For each cart item, fetch product data and merge
    const items = await Promise.all(
      selectedWishList.items.map(async (item) => {
        // fetch full product document
        const { data: productDoc } = await axios.get(
          `http://localhost:5001/api/product/${item.productId}`
        );
        // merge the item fields + the fetched product
        return {
          _id:               item._id,
          productId:         item.productId,          
          product:           productDoc
        };
      })
    );
      console.log(items)
    return res.status(200).json({ items });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Failed to get items", error: err.message });
  }
};


const delete_product = async (req,res) => {
    const userId  = req.params.userId;
    const productId = req.params.productId;
    try {
       const updatedWishList = await wishList.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId: productId } } },
      { new: true } // to return the updated document
    );

    if(!updatedWishList){
         return res.status(404).json({ message: "wishList not found" });
    }

    res.status(200).json({ message: "Item removed successfully", wishList: updatedWishList });

    } catch (error) {
        res.status(500).json({ message: "Failed to remove item", error: err.message })
    }
}

const existsInWishlist = async (req, res) => {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
        return res
            .status(400)
            .json({ message: "Both userId and productId are required" });
    }

    try {
        // find the user's wishlist
        const userList = await wishList.findOne({ userId });

        // if no wishlist at all, can't contain the product
        if (!userList) {
            return res.status(200).json({ exists: false });
        }

        // check if any item matches
        const exists = userList.items.some(item => item.productId === productId);

        return res.status(200).json({ exists });
    } catch (err) {
        console.error("Error checking wishlist existence:", err);
        return res
            .status(500)
            .json({ message: "Server error", error: err.message });
    }
};


export default {
    add_product,
    getWishlist,
    delete_product,
    existsInWishlist
}
