import cart from "../models/cart.js";
import axios from "axios";

const add_product = async (req, res) => {
  const cartBody = req.body;
  try {

    const cartExisting = await cart.findOne({userId : cartBody.userId});

    if(cartExisting){
        cartExisting.items.push(...cartBody.items);
        cartExisting.updatedAt = new Date(),
        await cartExisting.save();
        return res
      .status(200)
      .json({ msg: `new product add to cart : ${cartBody.userId} succesfully` });
    }

    cartBody.updatedAt = new Date();
    const newCart = new cart(cartBody);
    await newCart.save();


    return res
      .status(200)
      .json({ msg: `new product add to cart : ${cartBody.userId} succesfully` });
  } catch (error) {
      console.log(error);
    res.status(500).json({ message: "Failed to add item", error: error.message })
  }
};

const getCart = async (req, res) => {
  const userId = req.params.userId;

  try {
    const selectedCart = await cart.findOne({ userId : userId});
    if (!selectedCart) {
      return res
        .status(404)
        .json({ msg: `No cart found for user: ${userId}` });
    }

    // For each cart item, fetch product data and merge
    const items = await Promise.all(
      selectedCart.items.map(async (item) => {
        // fetch full product document
        const { data: productDoc } = await axios.get(
          `http://localhost:5001/api/product/${item.productId}`
        );
        // merge the item fields + the fetched product
        return {
          _id:               item._id,
          productId:         item.productId,
          colorSelected:     item.colorSelected,
          sizeSelected:      item.sizeSelected,
          quantitySelected:  item.quantitySelected,
          total:             item.total,
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
    const itemId = req.params.itemId;
    try {
       const updatedCart = await cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { _id: itemId } } },
      { new: true } // to return the updated document
    );

    if(!updatedCart){
         return res.status(404).json({ message: "Cart not found" });
    }

    res.status(200).json({ message: "Item removed successfully", cart: updatedCart });

    } catch (error) {
        res.status(500).json({ message: "Failed to remove item", error: err.message })
    }
}



export default {
    add_product,
    getCart,
    delete_product
}
