<<<<<<< HEAD
$(document).ready(function() {
    $('#giocatori').DataTable( {
        data: users,
        "columnDefs": [
            {
                "targets": [ 0 ],
                "visible": true,
                "searchable": false,
            },
            {
                "targets": [ 1 ],
                "visible": true,
                "searchable": false,
            },
            {
                "targets": [ 2 ],
                "visible": true,
                "searchable": false,
            },
            {
                "targets": [ 3 ],
                "visible": true,
                "searchable": false,
            },
            {
                "targets": [ 4 ],
                "visible": true,
                "searchable": false,
            },
        ]
    } );
=======
$(document).ready(function() {
    $('#giocatori').DataTable( {
        data: users,
        "columnDefs": [
            {
                "targets": [ 0 ],
                "visible": true,
                "searchable": false,
            },
            {
                "targets": [ 1 ],
                "visible": true,
                "searchable": false,
            },
            {
                "targets": [ 2 ],
                "visible": true,
                "searchable": false,
            },
            {
                "targets": [ 3 ],
                "visible": true,
                "searchable": false,
            },
            {
                "targets": [ 4 ],
                "visible": true,
                "searchable": false,
            },
        ]
    } );
>>>>>>> c1bd1e63e504a0789d4cf8ceda6a45c30fd02dd1
} );