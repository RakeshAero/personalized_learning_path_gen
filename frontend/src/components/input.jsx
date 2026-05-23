function Input({
    type = "text",
    placeholder,
    value,
    onChange,
}){

    return (
        <input 
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="border p-2 w-full mb-4 rounded"
        >
        </input>
    )
}

export default Input;