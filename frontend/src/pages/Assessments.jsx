function Assessments() {

    const response = API.get(`assessments/${id}`)

    return (
        <div>
            <h1>Assessments Page</h1>
            <p>This is the Assessments page.</p>
        </div>
    );
}