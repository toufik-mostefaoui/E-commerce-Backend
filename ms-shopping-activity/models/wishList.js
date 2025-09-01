import mongoose from "mongoose";

const wishListSchema = mongoose.Schema({
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

            }
        ],

        updatedAt : {
            type : Date,
            required : true
        }
});

export default mongoose.model("wishLists" , wishListSchema);