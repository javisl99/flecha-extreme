<?php

class EAMainApi
{
    /**
     * EAMainApi constructor.
     * @param tad_DI52_Container $container
     */
    public function __construct($container)
    {
        $controller = new EAApiFullCalendar($container['db_models'], $container['options'], $container['mail']);
        $controller->register_routes();

        $logController = new EALogActions($container['db_models']);
        $logController->register_routes();

        $gdpr = new EAGDPRActions($container['db_models']);
        $gdpr->register_routes();

        $vacation = new EAVacationActions($container['db_models'], $container['options']);
        $vacation->register_routes();
    }

}