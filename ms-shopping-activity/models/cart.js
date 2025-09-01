import mongoose from "mongoose";

const cartSchema = mongoose.Schema({
        userId : {
            type : String,
            required : true
        },

        items : [
            {
                productId : {
                    type : String,
                    required : true
                },
                

                colorSelected : {
                    type : String,
                    required : true
                },

                sizeSelected : {
                    type : String,

                },

                quantitySelected : {
                    type : String,
                    required : true
                },

                total : {
                    type : String,
                    required : true
                },



            }
        ],

        updatedAt : {
            type : Date,
            required : true
        }
});

export default mongoose.model("carts" , cartSchema);