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
} );