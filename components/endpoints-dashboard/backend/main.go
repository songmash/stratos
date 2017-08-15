package main

import (
	"errors"

	"github.com/SUSE/stratos-ui/components/app-core/backend/config"
	"github.com/SUSE/stratos-ui/components/app-core/backend/repository/interfaces"
	"github.com/labstack/echo"
	"strconv"
	"encoding/json"
)

const (
	CONFIG_KEY = "endpointsDashboard"
	DISABLE_KEY = "DISABLE_ENDPOINT_DASHBOARD"
)

type EndpointDashboardConfig struct {
	Disable bool     `json:"disable"`
}

type EndpointDashboard struct {
	portalProxy interfaces.PortalProxy
}

func Init(portalProxy interfaces.PortalProxy) (interfaces.StratosPlugin, error) {
	return &EndpointDashboard{portalProxy: portalProxy}, nil
}

func (endpointDashboard *EndpointDashboard) GetMiddlewarePlugin() (interfaces.MiddlewarePlugin, error) {
	return nil, errors.New("Not implemented!")

}

func (endpointDashboard *EndpointDashboard) GetEndpointPlugin() (interfaces.EndpointPlugin, error) {
	return nil, errors.New("Not implemented!")
}

func (endpointDashboard *EndpointDashboard) GetRoutePlugin() (interfaces.RoutePlugin, error) {
	return endpointDashboard, nil

}

func (endpointDashboard *EndpointDashboard) AddAdminGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (endpointDashboard *EndpointDashboard) AddSessionGroupRoutes(echoGroup *echo.Group) {
	// no-op
}

func (endpointDashboard *EndpointDashboard) Init() error {
	if disableStr, err := config.GetValue(DISABLE_KEY); err == nil {
		if disable, err := strconv.ParseBool(disableStr); err == nil && disable == true {
			endpointDashboardConfig := EndpointDashboardConfig{
				Disable: true,
			}
			if jsonString, err := json.Marshal(endpointDashboardConfig); err == nil {
				endpointDashboard.portalProxy.GetConfig().PluginConfig[CONFIG_KEY] = string(jsonString[:])
			}
		}

	}
	return nil
}
