import product from "../models/product.js";

const add_product = async (req, res) => {
  const productBody = req.body;

  try {
    const existingProduct = await product.findOne(productBody);
    if (existingProduct && !existingProduct.finished) {
      return res.status(409).json({ msg: "this product are already exist" });
    }
    if (productBody.quantityAvailable <= 0) {
      return res
        .status(400)
        .json({ msg: "the initial quantity must be more than 0" });
    }
    const newProduct = new product(productBody);
    newProduct.finished = false;
    await newProduct.save();
    return res
      .status(200)
      .json({ msg: "new product add successfully", newProduct });
  } catch (error) {
    console.log(error);
    if (error.name == "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ msg: "Validation failed", errors });
    }
    res.status(500).json({ msg: error });
  }
};

const update_product = async (req, res) => {
  const id = req.params.id;
  const updatedBody = req.body;
  try {
    if (updatedBody.quantityAvailable < 0) {
      return res
        .status(400)
        .json({ msg: "the initial quantity must be more than 0" });
    }
    const updatedProduct = await product.findByIdAndUpdate(
      id,
      { $set: updatedBody },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      res.status(404).json({ msg: "product not found" });
    }

    res
      .status(200)
      .json({ message: "Product updated successfully", updatedProduct });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: error.message });
  }
};

const delete_product = async (req, res) => {
  const id = req.params.id;

  try {
    const deletedProduct = await product.findByIdAndUpdate(
      id,
      { $set: { finished: true } },
      { new: true }
    );
    if (!deletedProduct) {
      res.status(404).json({ msg: "product not found" });
    }
    res
      .status(200)
      .json({ message: "Product deleted successfully", deletedProduct });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: error.message });
  }
};

const get_products = async (req, res) => {
  try {
    const products = await product.find({ finished: false });
    console.log(products);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ msg: `failed to fetch products ${error}` });
  }
};

const get_product_by_id = async (req, res) => {
  const id = req.params.id;
  try {
    const selecteProduct = await product.findOne({ _id: id });

    if (!selecteProduct || selecteProduct.finished) {
      return res.status(404).json({ msg: "product not found" });
    }

    console.log(selecteProduct);
    res.status(200).json(selecteProduct);
  } catch (error) {
    res.status(500).json({ msg: `failed to fetch product ${error}` });
  }
};

const get_product_by_type = async (req, res) => {
  const type = req.params.type;
  try {
    const selecteProducts = await product
                      .find(
                          { type: type  , finished: false },

    );

    if (!selecteProducts || selecteProducts.length === 0) {
      return res.status(404).json({ msg: "product not found" });
    }


    console.log(selecteProducts);
    res.status(200).json(selecteProducts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: `failed to fetch product ${error}` });
  }
};

// think how to do the sold out for product

const update_product_quantity = async(req,res)=>{
  const id = req.params.id;
  const quantity_required = req.params.quantity_required;

  try {

    const updatedProduct = await product.findOne({_id : id});

      if(!updatedProduct || updatedProduct.finished){
        return res.status(404).json({ msg: "product not found" });
      };

    const newQuantityAviable = updatedProduct.quantityAvailable - quantity_required;


      if(newQuantityAviable < 0){
        return res.status(404).json({ msg: "quantity not available" });
      };

      if(newQuantityAviable == 0){
        updatedProduct.quantityAvailable = newQuantityAviable;
        updatedProduct.finished = true;
        await updatedProduct.save();

        return res.status(200).json({msg : "the quantity updated succesfully " , updatedProduct});
      }

      updatedProduct.quantityAvailable = newQuantityAviable;
      await updatedProduct.save();

  res.status(200).json({msg : "the quantity updated succesfully " , updatedProduct});
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: `failed to update product quantity ${error}` });
  }
};



export default {
  add_product,
  update_product,
  delete_product,
  get_products,
  get_product_by_id,
  get_product_by_type,
  update_product_quantity
};
