<?php

test('api health check returns 200', function () {
    // The Laravel health endpoint is registered by withRouting(health: '/up')
    $this->get('/up')->assertOk();
});
